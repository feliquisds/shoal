import { User } from '../models/user';
import { prisma } from './instantiatePrisma';

export default async function getPendingUsers(): Promise<User[]> {
    return await prisma.user.findMany({
        where: {
            pendingFriendRequestApproval: true,
            nintendoUserId: { not: null }
        },
    });
}