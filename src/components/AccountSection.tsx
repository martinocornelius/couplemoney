import { useState } from "react";
import { useAuth, useUser } from "../auth/AuthContext.tsx";
import { errorMessage } from "../lib/api.ts";
import { ErrorNote } from "./Form.tsx";
import { SecondaryLink } from "./Screen.tsx";

/** Your username, Change passcode, Admin (for the app admin only) and Log out. */
export default function AccountSection() {
  const user = useUser();
  const { logOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function logOutNow() {
    setBusy(true);
    setError(null);
    try {
      // Once logged out, the guards show the landing page.
      await logOut();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-sm">
      <h2 className="font-semibold">Your account</h2>
      <p className="text-slate-600">
        Logged in as <span className="font-semibold text-slate-800">{user.username}</span>
      </p>
      <SecondaryLink to="/passcode">Change passcode</SecondaryLink>
      {user.isAdmin && <SecondaryLink to="/admin">Admin</SecondaryLink>}
      <ErrorNote message={error} />
      <button
        type="button"
        onClick={logOutNow}
        disabled={busy}
        className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
    </section>
  );
}
