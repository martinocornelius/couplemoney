// Route guards: each screen only shows to the accounts it's meant for.

import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext.tsx";

function Loading() {
  return <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">Loading…</div>;
}

/** Landing, Sign up and Log in. A logged-in account goes straight into the app. */
export function LoggedOutOnly() {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

/** Everything else needs an account. Right after an admin reset, it chooses a new passcode first. */
export function LoggedInOnly({ allowMustChange = false }: { allowMustChange?: boolean }) {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.mustChangePasscode && !allowMustChange) return <Navigate to="/passcode" replace />;
  return <Outlet />;
}

/** Screens inside a home. An account without one goes to Create or join a home. */
export function InHomeOnly() {
  const { user } = useAuth();
  return user?.home ? <Outlet /> : <Navigate to="/setup" replace />;
}
