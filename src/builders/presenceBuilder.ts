import { PresenceGame, PresenceOnline_4 } from '@samuelthomas2774/nxapi/coral';

export default function buildPresence(presence: PresenceOnline_4, startTimestamp: number, showPlayTime: boolean) {
    const game = presence.game as PresenceGame;
    const name = game.name;
    const playTime = Math.floor(game.totalPlayTime / 60);
    const firstTimePlaying = game.firstPlayedAt == 0;
    const platform = presence.platform == 1 ? 'Nintendo Switch' : 'Nintendo Switch 2';
    const imageUri = game.imageUri;

    const playTimeHours = `${playTime} hour${playTime > 1 ? 's' : ''}`;
    const playTimeFormatted = playTime < 1 ? 'a little while' : playTimeHours;
    const playTimeText = firstTimePlaying ? 'First time playing!' : `Played for ${playTimeFormatted}`;

    const isNintendoClassics = name.includes('Nintendo Classics');
    let nintendoClassicsText = '';
    if (isNintendoClassics) {
        let gameName = game.sysDescription.slice(game.sysDescription.indexOf(':') + 1).trim();
        let nintendoClassicsConsole = name.split(/\s*\p{Pd}+\s*/u)[0].trim();
        nintendoClassicsText = `${gameName} (${nintendoClassicsConsole})`;
    }

    return {
        activities: [{
            name: isNintendoClassics ? nintendoClassicsText : name,
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