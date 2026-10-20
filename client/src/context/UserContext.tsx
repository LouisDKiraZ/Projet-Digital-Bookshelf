// There is no login yet (see CLAUDE.md "Known gaps"). The app only needs
// to know who's acting so a shelf can record a creator and a members list
// can exist later. A display name typed once, persisted in localStorage
// and mirrored to the `users` table, is enough for that.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { identifyUser, type IdentifiedUser } from '../api/userApi';

const STORAGE_KEY = 'digital-bookshelf.displayName';

interface UserContextValue {
  user: IdentifiedUser | null;
  isLoading: boolean;
  setDisplayName: (displayName: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IdentifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEY);
    if (!storedName) {
      setIsLoading(false);
      return;
    }
    identifyUser(storedName)
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  async function setDisplayName(displayName: string) {
    const identified = await identifyUser(displayName);
    localStorage.setItem(STORAGE_KEY, identified.displayName);
    setUser(identified);
  }

  return (
    <UserContext.Provider value={{ user, isLoading, setDisplayName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider.');
  }
  return context;
}
