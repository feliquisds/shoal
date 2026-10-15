import * as crypto from 'node:crypto';
import { NINTENDO_NSO_CLIENT_ID, NINTENDO_NSO_REDIRECT_URI, NINTENDO_AUTH_NSO_TOKEN_URL } from '../config/appConstants';

export default function buildNsoAuthUrl(codeVerifier: string, state = crypto.randomBytes(24).toString('hex')): string {
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

    const params = new URLSearchParams({
        client_id: NINTENDO_NSO_CLIENT_ID,
        redirect_uri: NINTENDO_NSO_REDIRECT_URI,
        response_type: 'session_token_code',
        scope: 'openid user user.birthday user.screenName',
        session_token_code_challenge: codeChallenge,
        session_token_code_challenge_method: 'S256',
        state: state,
        theme: 'login_form',
    });

    return `${NINTENDO_AUTH_NSO_TOKEN_URL}${params.toString()}`;
}