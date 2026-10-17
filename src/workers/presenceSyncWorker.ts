import callUpdatePresence from '../clients/discord/callUpdatePresence';
import callDeletePresence from '../clients/discord/callDeletePresence';
import { decryptUserData, encryptUserData } from '../utils/encryptionUtils';
import buildPresence from '../builders/presenceBuilder';
import callRefreshToken from '../clients/discord/callRefreshToken';
import { TokenData } from '../models/discord/tokenData';
import { User } from '../models/user';
import updateUserPresence from '../repository/updateUserPresence';
import { logInfoWithDiscordId as logInfo, logErrorWithDiscordId as logError } from '../utils/logUtils';
import upsertDiscordUser from '../repository/upsertDiscordUser';
import { describeDiscordRefreshTokenResponse } from '../utils/errorUtils';
import buildSyncUsers from '../builders/syncUsersBuilder';
import { PresenceOnline_4 } from '@samuelthomas2774/nxapi/coral';

const syncInterval = Number(process.env.SYNC_INTERVAL) * 1000;
let inSync = new Set<string>();
export let usersOnline = new Map<string, { timestamp: number, game: string, activityToken: string }>();
export let rateLimitRetryAfter: number;

export default function startPresenceSync(): void {
    setInterval(async () => {
        if (Date.now() < rateLimitRetryAfter) {
            console.warn('Presence sync is rate limited');
            return;
        }

        console.info('Starting presence sync...');

        const build = await buildSyncUsers();
        if (!build)
            return;

        const { syncUsers, friendList } = build;

        await Promise.all(syncUsers.map(async (user: User) => {
            if (inSync.has(user.discordId)) return;
            inSync.add(user.discordId);

            try {
                const { accessToken, success } = await refreshToken(user);
                if (!success) return;

                const presence = friendList.find(friend => friend.nsaId === user.nintendoUserId!)?.presence;

                if (!presence || presence.state == 'OFFLINE' || presence.state == 'INACTIVE') {
                    logInfo(user.discordId, 'User is offline');
                    if (usersOnline.has(user.discordId)) {
                        await callDeletePresence(decryptUserData(accessToken), usersOnline.get(user.discordId)!.activityToken);
                        usersOnline.delete(user.discordId);
                        logInfo(user.discordId, 'Previous presence deleted');
                    }
                    return;
                }

                logInfo(user.discordId, 'User is online');
                const builtPresence = buildPresence(presence as PresenceOnline_4, user.discordId, user.showHoursPlayed, usersOnline.get(user.discordId)?.activityToken);
                const activityToken = await callUpdatePresence(decryptUserData(accessToken), builtPresence);

                const activity = builtPresence.activities[0];
                usersOnline.set(user.discordId, { timestamp: activity.timestamps.start, game: activity.name, activityToken });
                logInfo(user.discordId, 'Presence synced');
            } catch (error: any) {
                logError(user.discordId, `Network failure: ${error.message}`);
            } finally {
                inSync.delete(user.discordId);
            }
        }))
    }, syncInterval);
}

async function refreshToken(user: User): Promise<{ accessToken: string, success: boolean }> {
    if (user.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
        logInfo(user.discordId, 'Token is expired, refreshing token...');

        let responseTemp;
        try {
            responseTemp = await callRefreshToken(decryptUserData(user.discordRefreshToken!));
        } catch (error: any) {
            logError(user.discordId, `Network failure: ${error.message}`);
            return { accessToken: '', success: false };
        }

        const response = responseTemp;
        const { shouldDisablePresence, success, retryAfter } = await describeDiscordRefreshTokenResponse(response, user.discordId);
        rateLimitRetryAfter = retryAfter || 0;

        if (shouldDisablePresence) {
            logError(user.discordId, 'Presence syncing will be disabled');
            await updateUserPresence(user.discordId, false);
            return { accessToken: '', success: false };
        }

        if (success) {
            const { access_token, refresh_token, expires_in } = (await response.json()) as TokenData;

            try {
                await upsertDiscordUser(user.discordId, access_token, refresh_token, new Date(Date.now() + expires_in * 1000));
            } catch (error: any) {
                logError(user.discordId, `Failed to update Discord tokens in database: ${error.message}`);
                return { accessToken: '', success: false };
            }

            logInfo(user.discordId, 'Token refreshed');
            return { accessToken: encryptUserData(access_token!), success: true };
        }

        return { accessToken: '', success: false };
    }
    return { accessToken: user.discordAccessToken, success: true };
}