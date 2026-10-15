import { prisma } from './instantiatePrisma';

export default async function updateNintendoUser(userDiscordId: string, userId: string): Promise<void> {
    await prisma.user.update({
      where: { discordId: userDiscordId },
      data: {
        nintendoUserId: userId
      }
    });
}