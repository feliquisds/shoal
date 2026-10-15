import { Request, Response } from 'express';
import Callback from '../../models/callback';
import { getDiscordIdFromAuthToken } from '../../utils/transientAuthUtils';
import deleteUsers from '../../repository/deleteUsers';
import callDeletePresence from '../../clients/discord/callDeletePresence';
import getUser from '../../repository/getUser';
import { decryptUserData } from '../../utils/encryptionUtils';

export default async function handleDeleteAccount(req: Request, res: Response): Promise<Response | void> {
    const callback = new Callback();

    const discordId = getDiscordIdFromAuthToken(req.headers.authorization?.toString().split(' ')[1]);

    if (!discordId) {
        console.error('Transient auth token missing or invalid');
        callback.error = 'invalid_transient_auth';
        return res.status(400).json(callback);
    }

    try {
        const user = await getUser(discordId);
        if (!user) {
            console.error(`User with Discord ID ${discordId} not found`);
            callback.error = 'user_not_found';
            return res.status(400).json(callback);
        }

        await callDeletePresence(decryptUserData(user.discordAccessToken));
        await deleteUsers([discordId]);
        console.info(`User with Discord ID ${discordId} deleted`);
        return res.status(200).json();
    } catch (error: any) {
        console.error(`Error occurred while deleting user account: ${error.message}`);
        callback.error = 'account_deletion_failed';
        return res.status(500).json(callback);
    }
}