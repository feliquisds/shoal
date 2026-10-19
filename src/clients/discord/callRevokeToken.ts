import { DISCORD_AUTH_REVOKE_TOKEN_URL } from '../../config/appConstants';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

export default async function callRevokeToken(token: string): Promise<void> {
    const response = await fetch(DISCORD_AUTH_REVOKE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                token: token
            })
        });
    
    if (!response.ok) {
        console.error(`Failed to revoke Discord auth token [${response.status} ${(await response.json()).message}]`);
    }
}