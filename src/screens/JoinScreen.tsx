import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { normalizeHomeCode } from "../../shared/homes.ts";
import { useAuth, type User } from "../auth/AuthContext.tsx";
import { Loading } from "../auth/guards.tsx";
import { withNext } from "../auth/next.ts";
import { ErrorNote } from "../components/Form.tsx";
import Screen, { ButtonLink, SecondaryLink } from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";

type InvitedHome = { id: string; name: string; members: string[] };
type LookUp = { code: string; home?: InvitedHome; error?: string };

const BAD_LINK = "This invite link doesn't work. The home code may have been reset: ask for a new invite link.";

/**
 * Opened from an invite link, or after typing a home code on Create or join a
 * home. Someone not logged in yet signs up or logs in first, then comes back.
 */
export default function JoinScreen() {
  const { code: param = "" } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const here = `/join/${param}`;
  const code = normalizeHomeCode(param);
  const [lookUp, setLookUp] = useState<LookUp | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canLookUp = Boolean(user && !user.mustChangePasscode && code);
  useEffect(() => {
    if (!canLookUp || !code) return;
    let cancelled = false;
    api<{ home: InvitedHome }>(`/api/join?code=${code}`)
      .then(({ home }) => {
        if (!cancelled) setLookUp({ code, home });
      })
      .catch((failure) => {
        if (!cancelled) setLookUp({ code, error: errorMessage(failure) });
      });
    return () => {
      cancelled = true;
    };
  }, [canLookUp, code]);

  if (user === undefined) return <Loading />;
  // Right after an admin reset, a new passcode comes first, then back here.
  if (user?.mustChangePasscode) return <Navigate to={withNext("/passcode", here)} replace />;

  const backTo = !user ? "/welcome" : user.home ? "/" : "/setup";

  if (!code) {
    return (
      <Screen title="Join a home" backTo={backTo}>
        <ErrorNote message={BAD_LINK} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen title="Join a home" backTo={backTo}>
        <p className="text-sm text-slate-600">
          You've been invited to a home on Couple Money. Sign up or log in first, and you'll come straight back here to join.
        </p>
        <ButtonLink to={withNext("/signup", here)}>Sign up</ButtonLink>
        <SecondaryLink to={withNext("/login", here)}>Log in</SecondaryLink>
      </Screen>
    );
  }

  async function join() {
    setBusy(true);
    setJoinError(null);
    try {
      const { user: updated } = await api<{ user: User }>("/api/join", { body: { code } });
      setUser(updated);
      navigate("/", { replace: true });
    } catch (failure) {
      setJoinError(errorMessage(failure));
      setBusy(false);
    }
  }

  const current = lookUp?.code === code ? lookUp : null;
  const home = current?.home;
  return (
    <Screen title="Join a home" backTo={backTo}>
      {!current && <p className="text-sm text-slate-500">Loading…</p>}
      {current?.error && (
        <>
          <ErrorNote message={current.error} />
          <SecondaryLink to={user.home ? "/" : "/setup"}>{user.home ? "Go to Home" : "Create or join a home"}</SecondaryLink>
        </>
      )}
      {home && (
        <>
          <section className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
            <p className="text-lg font-semibold">{home.name}</p>
            <p className="text-sm text-slate-600">Members: {home.members.join(", ")}</p>
          </section>
          {user.home?.id === home.id ? (
            <>
              <p className="text-sm text-slate-600">You're already in this home.</p>
              <ButtonLink to="/">Open the home</ButtonLink>
            </>
          ) : user.home ? (
            <>
              <p className="text-sm text-slate-600">
                You're already in {user.home.name}. An account is in one home at a time: to join this one, first leave yours
                in Home settings.
              </p>
              <SecondaryLink to="/settings">Home settings</SecondaryLink>
            </>
          ) : (
            <>
              <ErrorNote message={joinError} />
              <button
                type="button"
                onClick={() => void join()}
                disabled={busy}
                className="rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white active:bg-brand-600 disabled:opacity-60"
              >
                {busy ? "Please wait…" : `Join ${home.name}`}
              </button>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
