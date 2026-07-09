'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError } from '@/lib/api';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from '@/lib/auth-storage';
import {
  getProfileRequest,
  loginRequest,
  registerRequest,
  updateProfileRequest,
} from '@/lib/services';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    mobile: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    mobile?: string;
    email?: string;
    password?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      logout();
      return;
    }

    const response = await getProfileRequest(storedToken);
    setUser(response.data);
    setToken(storedToken);
    setAuthSession(storedToken, response.data);
  }, [logout]);

  useEffect(() => {
    const init = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(storedUser);

      try {
        await refreshProfile();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [logout, refreshProfile]);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await loginRequest(identifier, password);
    const { user: loggedInUser, accessToken } = response.data;

    if (loggedInUser.userType !== 'ADMIN') {
      throw new ApiError('Only admin users can access this panel', 403);
    }

    setAuthSession(accessToken, loggedInUser);
    setUser(loggedInUser);
    setToken(accessToken);
  }, []);

  const register = useCallback(
    async (payload: { name: string; mobile: string; email?: string; password: string }) => {
      const response = await registerRequest(payload);
      const { user: registeredUser, accessToken } = response.data;

      if (registeredUser.userType !== 'ADMIN') {
        clearAuthSession();
        throw new ApiError(
          'Registration successful, but admin access requires ADMIN role. Contact an existing admin.',
          403,
        );
      }

      setAuthSession(accessToken, registeredUser);
      setUser(registeredUser);
      setToken(accessToken);
    },
    [],
  );

  const updateProfile = useCallback(
    async (payload: {
      name?: string;
      mobile?: string;
      email?: string;
      password?: string;
    }) => {
      if (!token) throw new ApiError('Not authenticated', 401);

      const response = await updateProfileRequest(token, payload);
      setUser(response.data);
      setAuthSession(token, response.data);
    },
    [token],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, token, loading, login, register, logout, refreshProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
