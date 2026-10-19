import { Request, Response } from 'express';
import updateUserPresence from '../../repository/updateUserPresence';
import Callback from '../../models/callback';
import { getDiscordIdFromAuthToken } from '../../utils/transientAuthUtils';
import { ERROR_PROCESSING_SETTINGS_CHANGE_FAILED, ERROR_SETTINGS_INVALID_REQUEST_BODY, ERROR_TRANSIENT_AUTH_FAILED } from '../../config/appConstants';

export default async function handleChangeSettings(req: Request, res: Response): Promise<Response | void> {
    const callback = new Callback();

    const { isPresenceActive, showHoursPlayed } = req.body;
    const discordId = getDiscordIdFromAuthToken(req.headers.authorization?.toString().split(' ')[1]);

    if (!discordId) {
        console.error('Transient auth token missing or invalid');
        callback.error = ERROR_TRANSIENT_AUTH_FAILED;
        return res.status(400).json(callback);
    }

    if (typeof isPresenceActive !== 'boolean' || (showHoursPlayed !== undefined && typeof showHoursPlayed !== 'boolean')) {
        console.error('Invalid request body for settings change');
        callback.error = ERROR_SETTINGS_INVALID_REQUEST_BODY;
        return res.status(400).json(callback);
    }

    try {
        await updateUserPresence(discordId, isPresenceActive, showHoursPlayed);
        console.info(`User settings updated for Discord user ${discordId}`);
        return res.status(200).json();
    } catch (error: any) {
        console.error(`Error occurred while updating user settings: ${error.message}`);
        callback.error = ERROR_PROCESSING_SETTINGS_CHANGE_FAILED;
        return res.status(500).json(callback);
    }
}