<p align='center'>
    <img src='./public/assets/logo.svg' alt='Shoal Presence'>
</p>

Shoal Presence is a web application for sharing Nintendo Switch play activity on Discord, while staying completely server-side.

# Functionality

- [nxapi](https://github.com/samuelthomas2774/nxapi) library usage to connect a Nintendo Account for play activity monitoring;

- [Prisma ORM](https://github.com/prisma/orm) library usage for SQLite (also compatible with PostgreSQL);

- Register and login with a Discord connected app OAuth2 flow;

- Connect your Nintendo Account for Rich Presence with just your friend code;

- Web interface for updating settings, changing which Nintendo Account is connected to your Discord account, and deleting your registration;

- Automatic removal of registered users from database if said user deleted the monitoring account from their Switch friend list, and vice versa;

- Encryption of sensitive Discord user data.

# Setup

> [!IMPORTANT]
> Currently, Shoal Presence relies on an experimental version of nxapi. Refer to the instructions in the .npmrc.example file for proper setup with npm.

```
git clone https://github.com/feliquisds/shoal.git
cd shoal
cp .env.example .env
cp .npmrc.example .npmrc
npm install
npm run generate
npm run dbpush
npm run dev
```

By default, the app runs on port 3000.

# Configuration

To configure Shoal Presence, you must go through the [Discord Developer Portal]() and [nxapi-auth]()

| Variable                     | Description                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PORT                         | Port used for the application (default: 3000) **(optional)**                                                                                                |
| SYNC_INTERVAL                | Sync interval between batches of presence updates in seconds (default: 30) **(optional)**                                                                   |
| NINTENDO_ACCOUNT_TOKEN       | Token to automatically login to the monitor Nintendo Account on startup (if missing, app starts nxapi's login flow through the command line) **(optional)** |
| DATABASE_FILE                | SQLite file path for the database (example: file:./shoal.db)                                                                                                |
| ENCRYPTION_KEY               | Key used to encrypt user data, generate one with `console.log(require('crypto').randomBytes(32).toString('base64'))`                                        |
| DISCORD_CLIENT_ID            | Your Discord application's client ID                                                                                                                        |
| DISCORD_CLIENT_SECRET        | Your Discord application's client secret                                                                                                                    |
| NXAPI_ZNCA_API_CLIENT_ID     | Your nxapi-auth client ID                                                                                                                                   |
| NXAPI_ZNCA_API_CLIENT_SECRET | Your nxapi-auth client secret                                                                                                                               |

> [!IMPORTANT]
> When setting up nxapi-auth, you must enable the scopes: ca:gf (f-generation), ca:er (Request encryption), and ca:dr (Response decryption).

> [!IMPORTANT]
> When setting up your Discord application, add `/discord/auth/callback` to the redirect URI for it to work with Shoal Presence.

**Keep your environment variables safe.**

# Credits

- [nxapi](https://github.com/samuelthomas2774/nxapi): Robust library that functions as the core of Shoal Presence and other related apps.
- [Reef](https://github.com/Bentheminernz/reef): Inspiration for developing Shoal Presence as an alternative and a learning experience.
