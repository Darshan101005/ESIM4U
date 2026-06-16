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
