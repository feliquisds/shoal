export type User = {
    id: string;
    discordId: string;
    discordAccessToken: string;
    discordRefreshToken: string;
    tokenExpiresAt: Date;
    nintendoUserId: string | null;
    pendingFriendRequestApproval: boolean;
    isPresenceActive: boolean;
    showHoursPlayed: boolean;
}