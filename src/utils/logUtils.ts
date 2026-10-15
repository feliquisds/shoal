export function logInfoWithDiscordId(discordId: string, message: string) {
    console.info(`[${discordId}] ${message}`);
}

export function logErrorWithDiscordId(discordId: string, message: string) {
    console.error(`[${discordId}] ${message}`);
}