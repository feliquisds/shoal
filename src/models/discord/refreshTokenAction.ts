export default class RefreshTokenAction {
    shouldDisablePresence: boolean;
    success: boolean;
    retryAfter?: number;

    constructor(shouldDisablePresence: boolean, success: boolean, retryAfter?: number) {
        this.shouldDisablePresence = shouldDisablePresence;
        this.success = success;
        this.retryAfter = retryAfter;
    }
}