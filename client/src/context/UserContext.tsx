import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { IdentifiedUser } from '../api/userApi';

const SESSION_KEY = 'digital-bookshelf.session';

interface UserContextValue {
  user: IdentifiedUser | null;
  isLoading: boolean;
  loginSession: (user: IdentifiedUser) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IdentifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  function loginSession(loggedInUser: IdentifiedUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, isLoading, loginSession, logout }}>
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