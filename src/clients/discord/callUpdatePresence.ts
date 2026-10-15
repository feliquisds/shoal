import { DISCORD_HEADLESS_SESSION_URL } from '../../config/appConstants';

export default async function callUpdatePresence(accessToken: string, activity: any): Promise<void> {
    const response = await fetch(DISCORD_HEADLESS_SESSION_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
    });

    if (!response.ok) {
        console.error(`Failed to sync headless presence [${response.status}]`);
    }
}