import { prisma } from './instantiatePrisma';
import { encryptUserData } from '../utils/encryptionUtils';

export default async function upsertDiscordUser(userId: string, accessToken: string, refreshToken: string, tokenExpiresAt: Date): Promise<void> {
    await prisma.user.upsert({
        where: { discordId: userId },
        update: {
            ...(accessToken && { discordAccessToken: encryptUserData(accessToken) }),
            ...(refreshToken && { discordRefreshToken: encryptUserData(refreshToken) }),
            ...(tokenExpiresAt && { tokenExpiresAt: tokenExpiresAt })
        },
        create: {
            discordId: userId,
            discordAccessToken: encryptUserData(accessToken),
            discordRefreshToken: encryptUserData(refreshToken),
            tokenExpiresAt: tokenExpiresAt,
            isPresenceActive: true
        },
    });
}