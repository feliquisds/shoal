import { prisma } from './instantiatePrisma';
import { User } from '../models/user';

export default async function getUser(discordUserId: string): Promise<User | null> {
    return await prisma.user.findUnique({
        where: {
            discordId: discordUserId,
        }
    });
}