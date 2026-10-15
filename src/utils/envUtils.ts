import { Buffer } from 'node:buffer';
import { DEFAULT_PRESENCE_SYNC_INTERVAL } from '../config/appConstants';
import { readFile, writeFile } from 'node:fs/promises';

export const ENV_FILE = '.env';

const REQUIRED_ENV_VARIABLES = [
    'DATABASE_FILE',
    'ENCRYPTION_KEY',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'NXAPI_ZNCA_API_CLIENT_ID'
] as const;

function isMissing(value: string | undefined): boolean {
    return !value || value.trim().length === 0;
}

function hasValidEncryptionKey(value: string): boolean {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
        return false;
    }

    return Buffer.from(value, 'base64').length === 32;
}

function isValidIntervalMs(): void {
    const interval = Number(process.env.SYNC_INTERVAL);

    if (Number.isFinite(interval) && interval >= 1 && Math.floor(interval) === interval) {
        return;
    }

    console.warn(`Invalid SYNC_INTERVAL value: ${process.env.SYNC_INTERVAL}. Using default ${DEFAULT_PRESENCE_SYNC_INTERVAL}s`);
    process.env.SYNC_INTERVAL = DEFAULT_PRESENCE_SYNC_INTERVAL.toString();
}

export function verifyEnvironment(): void {
    const errors: string[] = [];

    for (const variable of REQUIRED_ENV_VARIABLES) {
        if (isMissing(process.env[variable])) {
            errors.push(`${variable} is missing`);
        }
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey && !hasValidEncryptionKey(encryptionKey)) {
        errors.push('ENCRYPTION_KEY must be a base64-encoded 32-byte key');
    }

    isValidIntervalMs();

    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
    }

    console.info('Environment configuration loaded');
}

export async function writeEnvValue(name: string, value: string): Promise<void> {
    let contents = '';

    try {
        contents = await readFile(ENV_FILE, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') {
            throw error;
        }
    }

    const lines = contents.split('\n');
    const searchLine = `${name}=`;

    const index = lines.findIndex(line => line.startsWith(searchLine));

    if (index === -1) lines.push(`${name}=${value}`);
    if (index !== -1) lines[index] = `${name}=${value}`;

    contents = lines.join('\n');
    process.env[name] = value;
    await writeFile(ENV_FILE, contents, 'utf8');
}
