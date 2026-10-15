import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const FORMAT_VERSION = 'v1';

function getEncryptionKey(): Buffer {
    return Buffer.from(ENCRYPTION_KEY, 'base64');
}

export function encryptUserData(value: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
        FORMAT_VERSION,
        iv.toString('base64url'),
        authTag.toString('base64url'),
        encrypted.toString('base64url'),
    ].join('.');
}

export function decryptUserData(value: string): string {
    const [version, encodedIv, encodedAuthTag, encodedCiphertext] = value.split('.');

    if (
        version !== FORMAT_VERSION
        || !encodedIv
        || !encodedAuthTag
        || !encodedCiphertext
    ) {
        throw new Error('Encrypted user data has an invalid format');
    }

    const iv = Buffer.from(encodedIv, 'base64url');
    const authTag = Buffer.from(encodedAuthTag, 'base64url');
    const ciphertext = Buffer.from(encodedCiphertext, 'base64url');

    if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
        throw new Error('Encrypted user data has invalid encryption metadata');
    }

    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString('utf8');
}
