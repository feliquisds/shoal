export const ROUTE_DISCORD_AUTH = '/discord/auth';
export const ROUTE_DISCORD_AUTH_CALLBACK = '/discord/auth/callback';
export const ROUTE_NINTENDO_CONNECT = '/nintendo/connect';
export const ROUTE_PRESENCE_SETTINGS = '/settings';
export const ROUTE_PRESENCE_DELETE_ACCOUNT = '/delete';

export const DISCORD_AUTH_SCOPES = 'openid+sdk.social_layer_presence';
export const DISCORD_AUTH_CONNECTED_APP_URL = 'https://discord.com/api/oauth2/authorize';
export const DISCORD_AUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token';
export const DISCORD_AUTH_REVOKE_TOKEN_URL = 'https://discord.com/api/oauth2/token/revoke';
export const DISCORD_PROFILE_URL = 'https://discord.com/api/users/@me';
export const DISCORD_HEADLESS_SESSION_URL = 'https://discord.com/api/v10/users/@me/headless-sessions';
export const DISCORD_HEADLESS_SESSION_DELETE_URL = 'https://discord.com/api/v10/users/@me/headless-sessions/delete';

export const NINTENDO_NSO_CLIENT_ID = '71b963c1b7b6d119';
export const NINTENDO_NSO_REDIRECT_URI = 'npf71b963c1b7b6d119://auth';
export const NINTENDO_AUTH_ACCOUNT_TOKEN_URL = 'https://accounts.nintendo.com/connect/1.0.0/api/session_token';
export const NINTENDO_AUTH_NSO_TOKEN_URL = 'https://accounts.nintendo.com/connect/1.0.0/authorize?';

export const DEFAULT_PRESENCE_SYNC_INTERVAL = 30;

export const ERROR_DISCORD_AUTH_FAILED = 'discord_auth_failed';
export const ERROR_DISCORD_TOKEN_EXCHANGE_FAILED = 'discord_token_exchange_failed';
export const ERROR_DISCORD_USER_FETCH_FAILED = 'discord_user_fetch_failed';

export const ERROR_NINTENDO_INVALID_FRIEND_CODE = 'nintendo_invalid_friend_code';
export const ERROR_NINTENDO_USER_NOT_FOUND = 'nintendo_user_not_found';
export const ERROR_NINTENDO_FRIEND_REQUEST_FAILED = 'nintendo_friend_request_failed';

export const ERROR_SETTINGS_INVALID_REQUEST_BODY = 'settings_invalid_request_body';
export const ERROR_TRANSIENT_AUTH_FAILED = 'transient_auth_failed';
export const ERROR_DATABASE_FETCH_FAILED = 'database_fetch_failed';
export const ERROR_DATABASE_USER_NOT_FOUND = 'database_user_not_found';

export const ERROR_PROCESSING_DISCORD_CALLBACK_FAILED = 'processing_discord_callback_failed';
export const ERROR_PROCESSING_NINTENDO_REQUEST_FAILED = 'processing_nintendo_request_failed';
export const ERROR_PROCESSING_SETTINGS_CHANGE_FAILED = 'processing_settings_change_failed';
export const ERROR_PROCESSING_ACCOUNT_DELETION_FAILED = 'processing_account_deletion_failed';