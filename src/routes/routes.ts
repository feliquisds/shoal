import { Router, Request } from 'express';
import handleDiscordAuthUrl from './discord/handleDiscordAuthUrl';
import handleDiscordCallback from './discord/handleDiscordCallback';
import { createDiscordState } from '../utils/securityUtils';
import handleNintendoRequest from './nintendo/handleNintendoRequest';
import handleChangeSettings from './presence/handleChangeSettings';
import handleDeleteAccount from './presence/handleDeleteAccount';
import { ROUTE_DISCORD_AUTH, ROUTE_DISCORD_AUTH_CALLBACK, ROUTE_NINTENDO_CONNECT, ROUTE_PRESENCE_DELETE_ACCOUNT, ROUTE_PRESENCE_SETTINGS } from '../config/appConstants';

const router = Router();

const redirectUri = (req: Request) => `${req.protocol}://${req.get('host')}${ROUTE_DISCORD_AUTH_CALLBACK}`;

router.get(ROUTE_DISCORD_AUTH, (req, res) => {
    const state = createDiscordState();
    return handleDiscordAuthUrl(res, state, redirectUri(req));
});

router.get(ROUTE_DISCORD_AUTH_CALLBACK, async (req, res) => {
    return await handleDiscordCallback(req, res, redirectUri(req));
});

router.post(ROUTE_NINTENDO_CONNECT, (req, res) => {
    return handleNintendoRequest(req, res);
});

router.put(ROUTE_PRESENCE_SETTINGS, (req, res) => {
    return handleChangeSettings(req, res);
});

router.delete(ROUTE_PRESENCE_DELETE_ACCOUNT, (req, res) => {
    return handleDeleteAccount(req, res);
});

export default router;