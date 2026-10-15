export default class Callback {
    error?: string;
    nintendoName?: string;
    nintendoImageUri?: string;
    discordTransientToken?: string;
    discordName?: string;
    discordImageUri?: string;
    presenceAccountName?: string;
    presenceAccountImageUri?: string;
    presenceEnabled?: boolean;
    showPlayTime?: boolean;

    toSearchParams(): URLSearchParams {
        const cleanEntries = Object.entries(this).filter(([_, value]) => value !== undefined);
        return new URLSearchParams(cleanEntries);
    }
};