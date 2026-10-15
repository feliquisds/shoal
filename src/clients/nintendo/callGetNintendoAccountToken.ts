import { NINTENDO_AUTH_ACCOUNT_TOKEN_URL, NINTENDO_NSO_CLIENT_ID } from '../../config/appConstants';

export default async function callGetNintendoAccountToken(sessionToken: string, codeVerifier: string): Promise<Response> {
    const response = await fetch(NINTENDO_AUTH_ACCOUNT_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
            client_id: NINTENDO_NSO_CLIENT_ID,
            session_token_code: sessionToken,
            session_token_code_verifier: codeVerifier
        }),
    });

    if (!response.ok) {
        console.error(`Failed to get Nintendo Account session token [${response.status}]`);
    }

    return response;
}