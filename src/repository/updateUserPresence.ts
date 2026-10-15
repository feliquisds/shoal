import { prisma } from './instantiatePrisma';

export default async function updateUserPresence(userId: string, enabled: boolean, showHoursPlayed?: boolean): Promise<void> {
    await prisma.user.update({
        where: { discordId: userId },
        data: {
            isPresenceActive: enabled,
            ...(showHoursPlayed !== undefined && { showHoursPlayed: showHoursPlayed }),
        }
    });
}