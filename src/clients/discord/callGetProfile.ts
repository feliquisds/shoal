import { DISCORD_PROFILE_URL } from '../../config/appConstants';

export default async function callGetProfile(accessToken: string): Promise<Response> {
    const response = await fetch(DISCORD_PROFILE_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.error(`Failed to get Discord profile [${response.status}]`);
    }

    return response;
}