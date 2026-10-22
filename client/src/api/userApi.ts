import { ApiError } from './httpClient';
import { identifyUser as identifyUserLocally } from '../lib/localStore';

export interface IdentifiedUser {
  id: number;
  displayName: string;
}

export async function identifyUser(displayName: string): Promise<IdentifiedUser> {
  try {
    return identifyUserLocally(displayName);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not identify user.', 400);
  }
}
