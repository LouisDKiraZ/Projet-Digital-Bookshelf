import { ApiError } from './httpClient';
import {
  getNotifications,
  getPendingInvitationForShelf,
  getUnreadNotificationCount,
  markNotificationsRead,
  respondToInvitation as respondToInvitationLocally,
  searchUsers as searchUsersLocally,
  sendInvitation as sendInvitationLocally,
} from '../lib/localStore';
import type { AppNotification, Invitation, ShelfMember } from '../types/shelf';

export async function searchUsers(query: string, excludeUserIds: number[]): Promise<ShelfMember[]> {
  return searchUsersLocally(query, excludeUserIds);
}

export async function fetchPendingInvitation(shelfId: number, toUserId: number): Promise<Invitation | null> {
  return getPendingInvitationForShelf(shelfId, toUserId);
}

export async function sendInvitation(shelfId: number, fromUserId: number, toUserId: number): Promise<void> {
  try {
    sendInvitationLocally(shelfId, fromUserId, toUserId);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Unable to send the invitation.", 400);
  }
}

export async function fetchNotifications(userId: number): Promise<AppNotification[]> {
  return getNotifications(userId);
}

export async function fetchUnreadNotificationCount(userId: number): Promise<number> {
  return getUnreadNotificationCount(userId);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  markNotificationsRead(userId);
}

export async function respondToInvitation(invitationId: number, respondingUserId: number, accept: boolean): Promise<void> {
  try {
    respondToInvitationLocally(invitationId, respondingUserId, accept);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Unable to respond to the invitation.", 400);
  }
}
