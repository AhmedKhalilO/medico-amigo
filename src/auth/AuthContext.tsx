import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiError, User, api, setAuthToken, setUnauthorizedHandler } from '../services/api';

const TOKEN_KEY = 'medico.token';

type Status = 'loading' | 'signedOut' | 'signedIn' | 'unreachable';

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  retry: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setUser(null);
    setStatus('signedOut');
  }, []);

  const startSession = useCallback(async (token: string, u: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
    setStatus('signedIn');
  }, []);

  const restore = useCallback(async () => {
    setStatus('loading');
    const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    if (!token) {
      setStatus('signedOut');
      return;
    }
    setAuthToken(token);
    try {
      const { user: me } = await api.me();
      setUser(me);
      setStatus('signedIn');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await clearSession();
      else setStatus('unreachable'); // serveur injoignable : on garde le jeton et on propose de réessayer
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    void restore();
    return () => setUnauthorizedHandler(null);
  }, [clearSession, restore]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        const r = await api.login(email.trim(), password);
        await startSession(r.token, r.user);
      },
      signUp: async (name, email, password) => {
        const r = await api.register(name.trim(), email.trim(), password);
        await startSession(r.token, r.user);
      },
      signOut: clearSession,
      setUser,
      retry: () => void restore(),
    }),
    [status, user, startSession, clearSession, restore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}