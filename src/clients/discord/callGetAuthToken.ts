import { DISCORD_AUTH_TOKEN_URL } from '../../config/appConstants';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

export default async function callGetAuthToken(code: string, redirectUri: string): Promise<Response> {
    const response = await fetch(DISCORD_AUTH_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });
    
    if (!response.ok) {
        console.error(`Failed to get Discord auth token [${response.status} ${(await response.json()).message}]`);
    }

    return response;
}