import { PresenceGame, Friend_4, PresenceOnline_4 } from '@samuelthomas2774/nxapi/coral';

export default function buildPresence(friend: Friend_4, startTimestamp: number, showPlayTime: boolean) {
    const presence = friend.presence as PresenceOnline_4;
    const game = presence.game as PresenceGame;
    const name = game.name;
    const playTime = Math.floor(game.totalPlayTime / 60);
    const firstTimePlaying = game.firstPlayedAt == 0;
    const platform = presence.platform == 1 ? 'Nintendo Switch' : 'Nintendo Switch 2';
    const imageUri = game.imageUri;

    const playTimeHours = `${playTime} hour${playTime > 1 ? 's' : ''}`;
    const playTimeFormatted = playTime < 1 ? 'a little while' : playTimeHours;
    const playTimeText = firstTimePlaying ? 'First time playing!' : `Played for ${playTimeFormatted}`;

    return {
        activities: [{
            name: name,
            type: 0,
            details: showPlayTime ? playTimeText : undefined,
            state: platform,
            platform: 'desktop',
            application_id: process.env.DISCORD_CLIENT_ID,
            timestamps: {
                start: startTimestamp
            },
            assets: {
                large_image: imageUri,
                large_text: name
            }
        }]
    };
}