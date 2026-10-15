const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
import { Request, Response } from 'express';
import { DISCORD_AUTH_CONNECTED_APP_URL } from '../../config/appConstants';

export default function handleDiscordAuthUrl(req: Request, res: Response, state: string, redirectUri: string): void {
    const scopes = 'openid+sdk.social_layer_presence';
    return res.redirect(`${DISCORD_AUTH_CONNECTED_APP_URL}client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state}`);
}