import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../api/client';
import { login as apiLogin, logout as apiLogout, fetchCurrentUser, getToken, removeToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const AUTH_TIMEOUT = 15000; // 15 seconds
      let timeoutId: ReturnType<typeof setTimeout>;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, AUTH_TIMEOUT);
      });
      
      Promise.race([fetchCurrentUser(), timeoutPromise])
        .then((data) => setUser(data.user))
        .catch(() => {
          removeToken();
          setUser(null);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setIsLoading(false);
        });
    } else {
      // Set loading to false in next tick to avoid setState during effect
      Promise.resolve().then(() => setIsLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    setUser(response.user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
    } catch {
      // Ignore errors during refresh
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
