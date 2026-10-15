import { prisma } from './instantiatePrisma';

export default async function deleteUsers(userIds: string[]): Promise<void> {
    await prisma.user.deleteMany({
        where: { discordId: { in: userIds } }
    });
}