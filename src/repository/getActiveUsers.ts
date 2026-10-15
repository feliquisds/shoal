import { User } from '../models/user';
import { prisma } from './instantiatePrisma';

export default async function getActiveUsers(): Promise<User[]> {
    return await prisma.user.findMany({
        where: {
            isPresenceActive: true,
            nintendoUserId: { not: null }
        },
    });
}