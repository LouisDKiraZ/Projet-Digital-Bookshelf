import { ApiError } from './httpClient';
import { registerUser as registerLocally, loginUser as loginLocally } from '../lib/localStore';

export interface IdentifiedUser {
  id: number;
  username: string;
  displayName: string;
}

export async function register(username: string, displayName: string, passwordRaw: string): Promise<IdentifiedUser> {
  try {
    return await registerLocally(username, displayName, passwordRaw);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Unable to create the account.", 400);
  }
}

export async function login(username: string, passwordRaw: string): Promise<IdentifiedUser> {
  try {
    return await loginLocally(username, passwordRaw);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Unable to log in.', 401);
  }
}