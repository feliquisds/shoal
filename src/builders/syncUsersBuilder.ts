import { Friend_4, SentFriendRequest } from '@samuelthomas2774/nxapi/coral';
import callDeletePresence from '../clients/discord/callDeletePresence';
import { User } from '../models/user';
import deleteUsers from '../repository/deleteUsers';
import getActiveUsers from '../repository/getActiveUsers';
import getPendingUsers from '../repository/getPendingUsers';
import updatePendingUsers from '../repository/updatePendingUsers';
import { decryptUserData } from '../utils/encryptionUtils';
import describeError from '../utils/errorUtils';
import { presenceState } from '../workers/loginPresenceAccountWorker';
import { usersOnline } from '../workers/presenceSyncWorker';

export default async function buildSyncUsers(): Promise<{ syncUsers: User[], friendList: Friend_4[] } | undefined> {
    let users: User[] = [];
    let pendingUsers: User[] = [];
    let friendList: Friend_4[] = [];
    let pendingFriendRequests: SentFriendRequest[] = [];

    try {
        users = await getActiveUsers();
    } catch (error: any) {
        console.error(`Failed to fetch active users: ${error.message}`);
        return;
    }

    try {
        pendingUsers = await getPendingUsers();
    } catch (error: any) {
        console.error(`Failed to fetch pending users: ${error.message}`);
        return;
    }

    try {
        friendList = (await presenceState.account.getFriendList()).friends;
    } catch (error: any) {
        console.error(`Failed to fetch friend list: ${describeError(error)}`);
        return;
    }

    try {
        pendingFriendRequests = (await presenceState.account.getSentFriendRequests()).friendRequests;
    } catch (error: any) {
        console.error(`Failed to fetch pending friend requests: ${describeError(error)}`);
        return;
    }

    const acceptedRequestUsers = pendingUsers.filter(pendingUser => pendingFriendRequests.every(request => request.receiver.nsaId !== pendingUser.nintendoUserId) && friendList.some(friend => friend.nsaId === pendingUser.nintendoUserId));
    if (acceptedRequestUsers.length > 0) {
        console.info(`Users that accepted the friend request: ${acceptedRequestUsers.length}`);
        try {
            await updatePendingUsers(acceptedRequestUsers.map(user => user.discordId), false);
            const acceptedUsers = acceptedRequestUsers.map(user => { user.pendingFriendRequestApproval = false; return user; });
            users = users.concat(acceptedUsers);
        } catch (error: any) {
            console.error(`Failed to update accepted users: ${describeError(error)}`);
        }
    }

    const rejectedRequestUsers = pendingUsers.filter(pendingUser => pendingFriendRequests.every(request => request.receiver.nsaId !== pendingUser.nintendoUserId) && friendList.every(friend => friend.nsaId !== pendingUser.nintendoUserId));
    if (rejectedRequestUsers.length > 0) {
        console.info(`Users that rejected the friend request: ${rejectedRequestUsers.length}`);
        try {
            await deleteUsers(rejectedRequestUsers.map(user => user.discordId));
            users = users.filter(user => !rejectedRequestUsers.some(rejectedUser => rejectedUser.discordId === user.discordId));
        } catch (error: any) {
            console.error(`Failed to delete rejected users: ${describeError(error)}`);
        }
    }

    const usersNotInFriendList = users.filter(user => user.nintendoUserId && !user.pendingFriendRequestApproval && !friendList.some(friend => friend.nsaId === user.nintendoUserId));
    if (usersNotInFriendList.length > 0) {
        console.warn(`Users in the database that are not in the friend list: ${usersNotInFriendList.length}`);
        for (const user of usersNotInFriendList) {
            try {
                if (usersOnline.has(user.discordId)) {
                    await callDeletePresence(decryptUserData(user.discordAccessToken), usersOnline.get(user.discordId)!.activityToken);
                    usersOnline.delete(user.discordId);
                }
                await deleteUsers([user.discordId]);
                users = users.filter(u => u.discordId !== user.discordId);
                console.info(`Cleared missing user: ${user.discordId}`);
            } catch (error: any) {
                console.error(`Failed to delete presence for missing user ${user.discordId}: ${describeError(error)}`);
            }
        }
    }

    const usersNotInDatabase = friendList.filter(friend => !users.some(user => user.nintendoUserId === friend.nsaId));
    if (usersNotInDatabase.length > 0) {
        console.warn(`Users in the friend list that are not in the database: ${usersNotInDatabase.length}`);
        await Promise.all(usersNotInDatabase.map(async (friend: Friend_4) => {
            try {
                await presenceState.account.deleteFriend(friend.nsaId);
                friendList = friendList.filter(f => f.nsaId !== friend.nsaId);
                console.info(`Cleared missing friend: ${friend.nsaId}`);
            } catch (error: any) {
                console.error(`Failed to delete friend: ${describeError(error)}`);
            }
        }));
    }

    const syncUsers = users.filter(user => !user.pendingFriendRequestApproval);
    return { syncUsers, friendList };
}