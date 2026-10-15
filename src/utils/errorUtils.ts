import { ErrorResponse } from '@samuelthomas2774/nxapi';
import { logErrorWithDiscordId as logError } from './logUtils';
import RefreshTokenAction from '../models/discord/refreshTokenAction';

export default function describeError(error: any): string {
    if (!(error instanceof ErrorResponse)) {
        return error.message || 'Unknown error';
    }

    switch (error.response.status) {
        case 400:
            return 'Bad request';
        case 401:
            return 'Unauthorized';
        case 403:
            return 'Forbidden';
        case 404:
            return 'Not found';
        case 429:
            return 'Rate limit exceeded';
        case 500:
            return 'Internal server error';
        case 503:
            return 'Service unavailable';
        default:
            return error.message || 'Unknown error';
    }
}

export async function describeDiscordRefreshTokenResponse(response: Response, discordId: string): Promise<RefreshTokenAction> {
    const responseStatus = response.status;

    if (response.ok) {
        return new RefreshTokenAction(false, true);
    }

    if (responseStatus.toString().startsWith('5')) {
        logError(discordId, `Discord API error while refreshing token [${responseStatus}]`);
        return new RefreshTokenAction(false, false);
    }

    if (responseStatus === 408) {
        logError(discordId, 'Discord API request timeout');
        return new RefreshTokenAction(false, false);
    }

    if (responseStatus === 429) {
        const retryEpochHeader = response.headers.get('X-RateLimit-Reset');
        let retryAfterHeader = response.headers.get('X-RateLimit-Reset-After');
        let retryAfterTime;

        let retryAfter: number;
        if (retryEpochHeader)
            retryAfter = Number(retryEpochHeader) * 1000;
        else
            retryAfter = Date.now() + 60 * 5 * 1000;

        if (retryAfterHeader) retryAfterTime = Math.ceil(Number(retryAfterHeader));

        const logExtra = retryAfterTime ? `, retrying in ${retryAfterTime} seconds` : '';
        logError(discordId, `Discord API rate limit exceeded${logExtra}`);
        return new RefreshTokenAction(false, false, retryAfter);
    }

    if (responseStatus === 400) {
        const { error } = await response.json();
        if (error === 'invalid_grant') {
            logError(discordId, 'Discord refresh token is invalid or expired');
            return new RefreshTokenAction(true, false);
        }

        logError(discordId, `Discord API error while refreshing token [${responseStatus}]`);
        return new RefreshTokenAction(false, false);
    }

    logError(discordId, `Unexpected Discord API error [${responseStatus}]`);
    return new RefreshTokenAction(true, false);
}
