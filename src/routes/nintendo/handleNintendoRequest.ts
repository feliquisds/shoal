import { Request, Response } from 'express';
import { presenceState } from '../../workers/loginPresenceAccountWorker';
import Callback from '../../models/callback';
import updateNintendoUser from '../../repository/updateNintendoUser';
import describeError from '../../utils/errorUtils';
import { getDiscordIdFromAuthToken } from '../../utils/transientAuthUtils';
import getUser from '../../repository/getUser';
import updatePendingUsers from '../../repository/updatePendingUsers';
import { ERROR_DATABASE_FETCH_FAILED, ERROR_DATABASE_USER_NOT_FOUND, ERROR_NINTENDO_FRIEND_REQUEST_FAILED, ERROR_NINTENDO_INVALID_FRIEND_CODE, ERROR_NINTENDO_USER_NOT_FOUND, ERROR_PROCESSING_NINTENDO_REQUEST_FAILED, ERROR_TRANSIENT_AUTH_FAILED } from '../../config/appConstants';

export default async function handleNintendoRequest(req: Request, res: Response): Promise<Response | void> {
    let callback = new Callback();

    const { friendCode } = req.body;
    const discordId = getDiscordIdFromAuthToken(req.headers.authorization?.toString().split(' ')[1]);

    if (!discordId) {
        console.error('Transient auth token missing or invalid');
        callback.error = ERROR_TRANSIENT_AUTH_FAILED;
        return res.status(400).json(callback);
    }

    let getDiscordUser;
    try {
        getDiscordUser = await getUser(discordId);
    } catch (error: any) {
        console.error(`Error occurred while fetching Discord user: ${describeError(error)}`);
        callback.error = ERROR_DATABASE_FETCH_FAILED;
        return res.status(500).json(callback);
    }
    
    const discordUser = getDiscordUser;
    if (!discordUser) {
        console.error(`User with Discord ID ${discordId} not found`);
        callback.error = ERROR_DATABASE_USER_NOT_FOUND;
        return res.status(400).json(callback);
    }

    if (!friendCode || typeof friendCode !== 'string' || !testFriendCodeFormat(friendCode)) {
        console.error('Invalid friend code provided');
        callback.error = ERROR_NINTENDO_INVALID_FRIEND_CODE;
        return res.status(400).json(callback);
    }

    try {
        const presenceAccount = presenceState.account;

        let userGet;
        try {
            userGet = await presenceAccount.getUserByFriendCode(friendCode);
        } catch (error: any) {
            if (describeError(error).includes('not found')) {
                console.error(`Failed to find user through friend code: ${describeError(error)}`);
                callback.error = ERROR_NINTENDO_USER_NOT_FOUND;
                return res.status(400).json(callback);
            }
            throw error;
        }
        const user = userGet;
        
        try {
            await presenceAccount.sendFriendRequest(user.nsaId);
            await updatePendingUsers([discordId], true);
            console.log(`Friend request sent to Nintendo user ${user.nsaId} for Discord user ${discordId}`);
            
            const checkAlreadyRegistered = (await getUser(discordId))?.nintendoUserId;
            if (checkAlreadyRegistered) {
                console.log(`Deleting friend previously connected to Discord user ${discordId}`);
                try {
                    await presenceAccount.deleteFriend(checkAlreadyRegistered);
                } catch (error: any) {
                    console.error(`Failed to delete previous friend: ${describeError(error)}`);
                }
            }
        } catch (error: any) {
            if (describeError(error).includes('Already friend'))
                console.info(`Nintendo user ${user.nsaId} is already a friend`);
            else {
                console.error(`Failed to send friend request: ${describeError(error)}`);
                callback.error = ERROR_NINTENDO_FRIEND_REQUEST_FAILED;
                return res.status(400).json(callback);
            }
        }

        await updateNintendoUser(discordId, user.nsaId);
        callback.presenceAccountName = presenceState.data.nsoAccount.user.name;
        callback.presenceAccountImageUri = presenceState.data.nsoAccount.user.imageUri;
        callback.nintendoName = user.name;
        callback.nintendoImageUri = user.imageUri;
        callback.presenceEnabled = discordUser.isPresenceActive;
        callback.showPlayTime = discordUser.showHoursPlayed;
        return res.status(200).json(callback);
    } catch (error: any) {
        console.error(`Error occurred while connecting to Nintendo: ${describeError(error)}`);
        callback.error = ERROR_PROCESSING_NINTENDO_REQUEST_FAILED;
        return res.status(500).json(callback);
    }
}

function testFriendCodeFormat(code: string): boolean {
    const regex = /^\d{4}-\d{4}-\d{4}$/;
    return regex.test(code);
}