import * as crypto from 'node:crypto';

const TOKEN_TTL_MS = 10 * 60 * 1000;

export function createDiscordAuthToken(discordId: string): string {
    const payload = Buffer.from(JSON.stringify({
        discordId,
        expiresAt: Math.floor(Date.now()) + TOKEN_TTL_MS,
    })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', process.env.ENCRYPTION_KEY!)
        .update(payload)
        .digest('base64url');

    return `${payload}.${signature}`;
}

export function getDiscordIdFromAuthToken(token: string | undefined): string | undefined {
    if (!token)
        return undefined;

    const separatorIndex = token.lastIndexOf('.');
    if (separatorIndex <= 0)
        return undefined;

    const [ payload, signature ] = token.split('.', 2);
    const expectedSignature = crypto
        .createHmac('sha256', process.env.ENCRYPTION_KEY!)
        .update(payload)
        .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer))
        return undefined;

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
            discordId?: string;
            expiresAt?: number;
        };

        if (typeof data.discordId !== 'string' || typeof data.expiresAt !== 'number' || data.expiresAt < Math.floor(Date.now()))
            return undefined;

        return data.discordId;
    } catch {
        return undefined;
    }
}
