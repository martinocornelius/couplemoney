// Who is logged in. The app asks the server once when it starts; screens
// update it after signing up, logging in, changing a passcode or logging out.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, errorMessage, onAccessLost } from "../lib/api.ts";

export type User = {
  username: string;
  isAdmin: boolean;
  /** True right after an admin reset, until a new passcode is chosen. */
  mustChangePasscode: boolean;
  home: { id: string; name: string } | null;
};

type Auth = {
  /** undefined while the app is still asking the server. */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onAccessLost((reason) => {
      if (reason === "logged_out") setUser(null);
      else setUser((current) => current && { ...current, home: null });
    });
    return () => onAccessLost(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ user: User }>("/api/me")
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch((error) => {
        if (cancelled) return;
        // Not logged in is normal; anything else (no signal, say) shouldn't look like being logged out.
        if (error instanceof ApiError && error.status === 401) setUser(null);
        else setLoadError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const logOut = useCallback(async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (error) {
      // Already logged out on the server: that's what we wanted anyway.
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, logOut }), [user, logOut]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setAttempt((count) => count + 1);
          }}
          className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white active:bg-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}

/** The logged-in account, on screens the guards only show to logged-in accounts. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useUser needs a logged-in account");
  return user;
}
