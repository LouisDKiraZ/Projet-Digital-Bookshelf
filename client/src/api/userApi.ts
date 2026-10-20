import { apiPostJson } from './httpClient';

export interface IdentifiedUser {
  id: number;
  displayName: string;
}

export function identifyUser(displayName: string): Promise<IdentifiedUser> {
  return apiPostJson<IdentifiedUser>('/api/users/identify', { displayName });
}
