import * as crypto from 'node:crypto';

const SECURITY_STATE_TTL_MS = 10 * 60 * 1000;
const states = new Map<string, number>();

function scheduleStateCleanup<T>(states: Map<string, T>, state: string): void {
    setTimeout(() => states.delete(state), SECURITY_STATE_TTL_MS).unref();
}

export function createDiscordState(): string {
    const state = crypto.randomBytes(24).toString('hex');;
    states.set(state, Date.now() + SECURITY_STATE_TTL_MS);
    scheduleStateCleanup(states, state);
    return state;
}

export function verifyDiscordState(state: string): boolean {
    const expiresAt = states.get(state);
    states.delete(state);

    return expiresAt !== undefined && expiresAt >= Date.now();
}