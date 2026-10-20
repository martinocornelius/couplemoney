import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { normalizeUsername } from "../../shared/accounts.ts";
import { useUser } from "../auth/AuthContext.tsx";
import { ErrorNote, SubmitButton, TextInput } from "../components/Form.tsx";
import Screen from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";
import { formatWib } from "../lib/dates.ts";

type Account = { username: string; createdAt: string; lockedUntil: string | null; resetExpiresAt: string | null };
type Reset = { oneTimePasscode: string; expiresAt: string; account: Account };

/**
 * For the app admin only: find an account and reset a forgotten passcode.
 * It never shows anyone's passcode or any home's money; the one-time
 * passcode from a reset is shown here once, and is gone when you leave.
 */
export default function AdminScreen() {
  const user = useUser();
  const backTo = user.home ? "/settings" : "/setup";
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [reset, setReset] = useState<Reset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user.isAdmin) {
    return (
      <Screen title="Admin" backTo={backTo}>
        <p className="text-sm text-slate-600">Only the app admin can open this page.</p>
      </Screen>
    );
  }

  async function find(event: FormEvent) {
    event.preventDefault();
    const username = normalizeUsername(search);
    if (!username) {
      setError("Type a username.");
      return;
    }
    setBusy(true);
    setError(null);
    setAccount(null);
    setReset(null);
    try {
      const found = await api<{ account: Account }>(`/api/admin/account?username=${encodeURIComponent(username)}`);
      setAccount(found.account);
    } catch (failure) {
      setError(errorMessage(failure));
    }
    setBusy(false);
  }

  async function resetPasscode(target: Account) {
    const sure = window.confirm(
      `Reset the passcode of ${target.username}?\n\n` +
        "Only do this after confirming it's really them, for example with a call. " +
        "Their current passcode stops working and they're logged out everywhere.",
    );
    if (!sure) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api<Reset>("/api/admin/reset", { body: { username: target.username } });
      setReset(result);
      setAccount(result.account);
    } catch (failure) {
      setError(errorMessage(failure));
    }
    setBusy(false);
  }

  return (
    <Screen title="Admin" backTo={backTo}>
      <p className="text-sm text-slate-600">
        Find an account to reset a forgotten passcode. Nobody, not even you, can see a passcode or any home's money.
      </p>
      <form onSubmit={find} noValidate className="flex flex-col gap-3">
        <TextInput
          label="Find an account"
          placeholder="Username"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <SubmitButton busy={busy}>Find</SubmitButton>
      </form>
      <ErrorNote message={error} />

      {account && (
        <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-sm">
          <h2 className="text-base font-semibold">{account.username}</h2>
          <p className="text-slate-600">Account made {formatWib(account.createdAt)}</p>
          <p className={account.lockedUntil ? "font-medium text-rose-800" : "text-slate-600"}>
            {account.lockedUntil
              ? `Locked after 5 wrong passcodes, until ${formatWib(account.lockedUntil)}`
              : "Not locked"}
          </p>
          {account.resetExpiresAt && !reset && (
            <p className="text-slate-600">
              A one-time passcode from an earlier reset works until {formatWib(account.resetExpiresAt)}. Reset again if it was
              lost.
            </p>
          )}
          {account.username === user.username ? (
            <p className="text-slate-600">
              This is your own account.{" "}
              <Link to="/passcode" className="font-semibold text-brand-700">
                Change your passcode
              </Link>{" "}
              instead.
            </p>
          ) : reset ? (
            <OneTimePasscode reset={reset} />
          ) : (
            <button
              type="button"
              onClick={() => void resetPasscode(account)}
              disabled={busy}
              className="rounded-xl border border-rose-300 bg-white px-4 py-3 font-semibold text-rose-800 active:bg-rose-50 disabled:opacity-60"
            >
              Reset passcode
            </button>
          )}
        </section>
      )}
    </Screen>
  );
}

function OneTimePasscode({ reset }: { reset: Reset }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reset.oneTimePasscode);
      setCopied("Copied.");
    } catch {
      setCopied("Couldn't copy. Press and hold the code to copy it.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-brand-600 bg-white p-3">
      <p className="font-semibold">One-time passcode for {reset.account.username}</p>
      <p className="select-all py-1 text-center font-mono text-2xl font-bold tracking-widest">{reset.oneTimePasscode}</p>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white active:bg-brand-600"
      >
        Copy
      </button>
      {copied && (
        <p role="status" className="text-center text-slate-600">
          {copied}
        </p>
      )}
      <p className="text-slate-600">
        Works until {formatWib(reset.expiresAt)}. Send it to {reset.account.username} privately, for example on WhatsApp: they
        log in with it and choose a new passcode. It's shown only this once, so if it gets lost, reset again.
      </p>
    </div>
  );
}
