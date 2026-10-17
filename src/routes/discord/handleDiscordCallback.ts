import { TokenData } from '../../models/discord/tokenData';
import { PublicDiscordUser } from '../../models/discord/publicDiscordUser';
import callGetAuthToken from '../../clients/discord/callGetAuthToken';
import callGetProfile from '../../clients/discord/callGetProfile';
import upsertDiscordUser from '../../repository/upsertDiscordUser';
import { Request, Response } from 'express';
import { verifyDiscordState } from '../../utils/securityUtils';
import { presenceState } from '../../workers/loginPresenceAccountWorker';
import describeError from '../../utils/errorUtils';
import Callback from '../../models/callback';
import { createDiscordAuthToken } from '../../utils/transientAuthUtils';
import getUser from '../../repository/getUser';

export default async function handleDiscordCallback(req: Request, res: Response, redirectUri: string): Promise<Response | void> {
    let callback = new Callback();

    let codeTemp;
    let stateTemp;

    try {
        codeTemp = req.query.code as string;
        stateTemp = req.query.state as string;
    } catch (error: any) {
        console.error(`Error parsing query parameters: ${error.message}`);
        callback.error = 'discord_auth_failed';
        return res.redirect(`/?${callback.toSearchParams().toString()}`);
    }

    const code = codeTemp;
    const state = stateTemp;

    if (!code || !state || !verifyDiscordState(state)) {
        console.error('Invalid Discord callback parameters');
        callback.error = 'discord_auth_failed';
        return res.redirect(`/?${callback.toSearchParams().toString()}`);
    }

    try {
        const tokenResponse = await callGetAuthToken(code, redirectUri);
        const tokenData = (await tokenResponse.json()) as TokenData;
        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('Failed to exchange code for Discord token');
            callback.error = 'discord_token_exchange_failed';
            return res.redirect(`/?${callback.toSearchParams().toString()}`);
        }

        const { access_token, refresh_token, expires_in } = tokenData;
        const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

        const userResponse = await callGetProfile(access_token);
        const user = (await userResponse.json()) as PublicDiscordUser;
        if (!userResponse.ok || !user.id) {
            console.error('Failed to fetch Discord user');
            callback.error = 'discord_user_fetch_failed';
            return res.redirect(`/?${callback.toSearchParams().toString()}`);
        }

        const newUser = await upsertDiscordUser(user.id, access_token, refresh_token, tokenExpiresAt);
        console.info(`Discord user ${user.id} added or updated`);

        callback.discordTransientToken = createDiscordAuthToken(user.id);
        callback.discordName = user.global_name || user.username;
        callback.discordImageUri = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        callback.presenceEnabled = newUser.isPresenceActive;
        callback.showPlayTime = newUser.showHoursPlayed;

        const nintendoUserId = (await getUser(user.id))?.nintendoUserId;
        if (nintendoUserId) {
            console.info(`Discord user ${user.id} is already connected to Nintendo Account ${nintendoUserId}`);

            try {
                const nintendoUserInfo = (await presenceState.account.getFriendList()).friends.find(friend => friend.nsaId === nintendoUserId);
                callback.nintendoName = nintendoUserInfo?.name || undefined;
                callback.nintendoImageUri = nintendoUserInfo?.imageUri || undefined;

                if (!nintendoUserInfo)
                    console.info(`Nintendo user ${nintendoUserId} is not in the friend list`);
            } catch (error: any) {
                console.error(`Error fetching Nintendo user info: ${describeError(error)}`);
            }
        }

        callback.presenceAccountName = presenceState.data.nsoAccount.user.name;
        callback.presenceAccountImageUri = presenceState.data.nsoAccount.user.imageUri;
        return res.redirect(`/?${callback.toSearchParams().toString()}`);
    } catch (error) {
        console.error('Error handling Discord callback: ', error);
        callback.error = 'discord_auth_failed';
        return res.redirect(`/?${callback.toSearchParams().toString()}`);
    }
}