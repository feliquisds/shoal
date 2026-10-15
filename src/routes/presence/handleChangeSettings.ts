import { Request, Response } from 'express';
import updateUserPresence from '../../repository/updateUserPresence';
import Callback from '../../models/callback';
import { getDiscordIdFromAuthToken } from '../../utils/transientAuthUtils';

export default async function handleChangeSettings(req: Request, res: Response): Promise<Response | void> {
    const callback = new Callback();

    const { isPresenceActive, showHoursPlayed } = req.body;
    const discordId = getDiscordIdFromAuthToken(req.headers.authorization?.toString().split(' ')[1]);

    if (!discordId) {
        console.error('Transient auth token missing or invalid');
        callback.error = 'invalid_transient_auth';
        return res.status(400).json(callback);
    }

    if (typeof isPresenceActive !== 'boolean' || (showHoursPlayed !== undefined && typeof showHoursPlayed !== 'boolean')) {
        console.error('Invalid request body for settings change');
        callback.error = 'invalid_request_body';
        return res.status(400).json(callback);
    }

    try {
        await updateUserPresence(discordId, isPresenceActive, showHoursPlayed);
        console.info(`User settings updated for Discord user ${discordId}`);
        return res.status(200).json();
    } catch (error: any) {
        console.error(`Error occurred while updating user settings: ${error.message}`);
        callback.error = 'settings_update_failed';
        return res.status(500).json(callback);
    }
}