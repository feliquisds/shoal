import { DISCORD_HEADLESS_SESSION_DELETE_URL } from '../../config/appConstants';

export default async function callDeletePresence(accessToken: string): Promise<void> {
    const response = await fetch(DISCORD_HEADLESS_SESSION_DELETE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        console.error(`Failed to delete headless presence [${response.status}]`);
    }
}