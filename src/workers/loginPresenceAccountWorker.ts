import * as crypto from 'node:crypto';
import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import CoralApi, { CoralAuthData } from '@samuelthomas2774/nxapi/coral';
import callGetNintendoAccountToken from '../clients/nintendo/callGetNintendoAccountToken';
import buildNsoAuthUrl from '../builders/nsoAuthUrlBuilder';
import { writeEnvValue } from '../utils/envUtils';
import describeError from '../utils/errorUtils';

const NINTENDO_ACCOUNT_TOKEN = process.env.NINTENDO_ACCOUNT_TOKEN;

export const presenceState: { account: CoralApi; data: CoralAuthData; } = { account: undefined as any, data: undefined as any };

export async function startLoginPresenceAccount(): Promise<void> {
    await prepareCoralApi();

    const account = presenceState.account;

    account.onTokenExpired = async () => {
        console.info('Nintendo Account token expired, renewing token...');

        try {
            const data = presenceState.data;
            const updatedData = await account.renewToken(process.env.NINTENDO_ACCOUNT_TOKEN!, data.user);
            presenceState.data = { ...data, ...updatedData };
            await writeEnvValue('NINTENDO_ACCOUNT_TOKEN', presenceState.data.nintendoAccountToken.access_token!);
            console.info('Nintendo Account token renewed and saved to .env');
        } catch (error: any) {
            throw new Error(`Failed to renew Nintendo Account token: ${describeError(error)}`);
        }
    };
}

async function prepareCoralApi(): Promise<void> {
    if (NINTENDO_ACCOUNT_TOKEN) {
        try {
            console.info('Saved Nintendo Account token found, logging in...');
            const { nso, data } = await CoralApi.createWithSessionToken(NINTENDO_ACCOUNT_TOKEN);
            console.info('Successfully logged in to Nintendo Account for presence monitoring with saved session token');
            presenceState.data = data;
            presenceState.account = nso;
            return;
        } catch (error: any) {
            console.warn(`Failed to login to Nintendo Account with saved session token: ${describeError(error)}`);
        }
    }

    let codeVerifier = crypto.randomBytes(32).toString('hex');
    let nsoToken: string = '';
    console.info(`\nVisit the following URL to authorize Nintendo Switch Online and Nintendo Account for presence monitoring:\n\n${buildNsoAuthUrl(codeVerifier)}\n`);

    const rl = readline.createInterface({ input, output });
    await new Promise<void>((resolve, reject) => {
        rl.question('\nAnd paste the redirect URL here: ', (inputString) => {
            try {
                if (typeof inputString !== 'string' || !inputString.trim()) {
                    throw new Error('Missing redirect URL');
                }

                const session = inputString.trim();
                const match = /session_token_code=([^&]+)/.exec(session);
                if (!match?.[1]) {
                    throw new Error('Invalid redirect URL');
                }

                nsoToken = match[1];
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                rl.close();
            }
        });
    });

    try {
        const tokenRes = await callGetNintendoAccountToken(nsoToken, codeVerifier);
        const { session_token: nintendoAccountToken } = await tokenRes.json();

        console.info('\nLogging in...')
        const { nso, data } = await CoralApi.createWithSessionToken(nintendoAccountToken);
        await writeEnvValue('NINTENDO_ACCOUNT_TOKEN', nintendoAccountToken);

        console.info('Successfully logged in to Nintendo Account for presence monitoring');
        console.info('Token was saved to .env, keep this file private');
        presenceState.account = nso;
        presenceState.data = data;
    } catch (error: any) {
        throw new Error(`Failed to login to Nintendo Account: ${describeError(error)}`);
    }
}