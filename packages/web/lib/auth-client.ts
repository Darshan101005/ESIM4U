import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { useState, useEffect, useCallback } from "react";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signUp, useSession } = authClient;

const SESSION_CACHE_KEY = "esim4u_session";
const SESSION_CACHE_TTL = 10 * 60 * 1000;

interface CachedSession {
  data: Record<string, unknown> | null;
  timestamp: number;
}

function getCachedSession(): CachedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (Date.now() - parsed.timestamp > SESSION_CACHE_TTL) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedSession(data: Record<string, unknown> | null) {
  try {
    if (data) {
      localStorage.setItem(
        SESSION_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {}
}

export function clearSessionCache() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {}
}

export interface CachedUser {
  name?: string;
  email?: string;
}

/**
 * Synchronously read the cached logged-in user (or null) from localStorage.
 * Used by public headers to render the right auth state on the first client
 * paint, avoiding a Login → Dashboard flip for returning users. Safe on the
 * server (returns null when localStorage is unavailable).
 */
export function getCachedUser(): CachedUser | null {
  const cached = getCachedSession();
  const user = cached?.data?.user as CachedUser | undefined;
  return user ?? null;
}

/**
 * Fetch the live session, refresh the cache, and return the current user.
 * Public headers call this once on mount to confirm/replace the cached state.
 */
export async function fetchAndCacheUser(): Promise<CachedUser | null> {
  try {
    const result = await authClient.getSession();
    const data = (result as { data: Record<string, unknown> | null })?.data || null;
    setCachedSession(data);
    return (data?.user as CachedUser | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function signOutAndClear() {
  clearSessionCache();
  await authClient.signOut();
}

export function useCachedSession() {
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchFromServer = useCallback(async () => {
    try {
      const result = await authClient.getSession();
      const sessionData = (result as { data: Record<string, unknown> | null })?.data || null;
      setSession(sessionData);
      setCachedSession(sessionData);
    } catch {
      setSession(null);
      clearSessionCache();
    } finally {
      setIsPending(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (hasFetched) return;

    const cached = getCachedSession();
    if (cached && cached.data) {
      setSession(cached.data);
      setIsPending(false);
      setHasFetched(true);
      return;
    }

    fetchFromServer();
  }, [hasFetched, fetchFromServer]);

  const invalidate = useCallback(() => {
    clearSessionCache();
    setHasFetched(false);
    setIsPending(true);
  }, []);

  return {
    data: session,
    isPending,
    invalidate,
  };
}
