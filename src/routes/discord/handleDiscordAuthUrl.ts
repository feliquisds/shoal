import { Response } from 'express';
import { DISCORD_AUTH_CONNECTED_APP_URL, DISCORD_AUTH_SCOPES } from '../../config/appConstants';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;

export default function handleDiscordAuthUrl(res: Response, state: string, redirectUri: string): void {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: DISCORD_AUTH_SCOPES,
        state: state
    });

    return res.redirect(`${DISCORD_AUTH_CONNECTED_APP_URL}?${params.toString()}`);
}