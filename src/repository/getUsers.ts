import { User } from '../models/user';
import { prisma } from './instantiatePrisma';

export default async function getUsers(): Promise<User[]> {
    return await prisma.user.findMany();
}