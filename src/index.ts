import 'dotenv/config';
import express from 'express';
import routes from './routes/routes';
import startPresenceSync from './workers/presenceSyncWorker';
import { verifyEnvironment } from './utils/envUtils';
import { startLoginPresenceAccount } from './workers/loginPresenceAccountWorker';
import { addUserAgent } from '@samuelthomas2774/nxapi'

verifyEnvironment();
addUserAgent('Shoal/1.0.4-rev1 (https://github.com/feliquisds/shoal)');
await startLoginPresenceAccount()

const app = express();
app.disable('x-powered-by');
app.enable('trust proxy');

app.use(express.json());
app.use(express.static('public'));
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.info(`Server running on http://localhost:${PORT}\n`);
    startPresenceSync();
});