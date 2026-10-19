import { Router, Request } from 'express';
import handleDiscordAuthUrl from './discord/handleDiscordAuthUrl';
import handleDiscordCallback from './discord/handleDiscordCallback';
import { createDiscordState } from '../utils/securityUtils';
import handleNintendoRequest from './nintendo/handleNintendoRequest';
import handleChangeSettings from './presence/handleChangeSettings';
import handleDeleteAccount from './presence/handleDeleteAccount';

const router = Router();

const redirectUri = (req: Request) => `${req.protocol}://${req.get('host')}/discord/auth/callback`;

router.get('/discord/auth', (req, res) => {
    const state = createDiscordState();
    return handleDiscordAuthUrl(res, state, redirectUri(req));
});

router.get('/discord/auth/callback', async (req, res) => {
    return await handleDiscordCallback(req, res, redirectUri(req));
});

router.post('/nintendo/connect', (req, res) => {
    return handleNintendoRequest(req, res);
});

router.put('/settings', (req, res) => {
    return handleChangeSettings(req, res);
});

router.delete('/delete', (req, res) => {
    return handleDeleteAccount(req, res);
});

export default router;