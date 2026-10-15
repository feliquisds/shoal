import { prisma } from './instantiatePrisma';

export default async function updatePendingUsers(userDiscordIds: string[], pending: boolean): Promise<void> {
    await prisma.user.updateMany({
      where: { discordId: { in: userDiscordIds } },
      data: {
        pendingFriendRequestApproval: pending
      }
    });
}