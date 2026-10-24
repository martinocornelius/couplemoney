import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { formatHomeCode } from "../../shared/homes.ts";
import { useAuth, type User } from "../auth/AuthContext.tsx";
import AccountSection from "../components/AccountSection.tsx";
import { ErrorNote, SuccessNote } from "../components/Form.tsx";
import Screen, { SecondaryLink } from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";
import { formatWib } from "../lib/dates.ts";
import { inviteLink, inviteMessage } from "../lib/invite.ts";

type Member = { id: string; username: string; joinedAt: string; you: boolean };
type HomeSettings = { id: string; name: string; code: string; members: Member[] };

const secondaryButton =
  "rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-60";

/** Screen 12: the home's invite, its members, budgets (Milestone 9), and your account. */
export default function SettingsScreen() {
  const { setUser } = useAuth();
  const justCreated = (useLocation().state as { created?: boolean } | null)?.created === true;
  const [home, setHome] = useState<HomeSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(justCreated ? "Your home is ready! Invite your family with the link below." : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ home: HomeSettings }>("/api/home")
      .then(({ home }) => {
        if (!cancelled) setHome(home);
      })
      .catch((failure) => {
        if (!cancelled) setError(errorMessage(failure));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Runs a change after the person confirms it, and shows what happened. */
  async function change(question: string, run: () => Promise<string | null>) {
    if (!window.confirm(question)) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      setNote(await run());
    } catch (failure) {
      setError(errorMessage(failure));
    }
    setBusy(false);
  }

  if (!home) {
    return (
      <Screen title="Home settings">
        {error ? <ErrorNote message={error} /> : <p className="text-sm text-slate-500">Loading…</p>}
      </Screen>
    );
  }

  const resetCode = () =>
    change(
      "Reset the home code?\n\nThe current code and invite link stop working. Everyone already in the home keeps working.",
      async () => {
        setHome((await api<{ home: HomeSettings }>("/api/home/code", { method: "POST" })).home);
        return "New home code ready. The old code and invite link no longer work.";
      },
    );

  const removeMember = (member: Member) =>
    change(
      `Remove ${member.username} from ${home.name}?\n\n` +
        "They lose access right away. They could join again with the home code, so reset the code too if they shouldn't.",
      async () => {
        setHome((await api<{ home: HomeSettings }>("/api/home/remove-member", { body: { memberId: member.id } })).home);
        return `${member.username} is no longer in the home.`;
      },
    );

  const leave = () =>
    change(
      home.members.length === 1
        ? `You're the only member of ${home.name}.\n\nIf you leave, its code stops working and nobody can open this home again. Leave anyway?`
        : `Leave ${home.name}?\n\nYou lose access to its money right away. To come back, you'll need the home code.`,
      async () => {
        // Without a home, the app goes to Create or join a home by itself.
        setUser((await api<{ user: User }>("/api/home/leave", { method: "POST" })).user);
        return null;
      },
    );

  return (
    <Screen title="Home settings">
      <section className="rounded-xl bg-brand-700 p-4 text-white">
        <p className="text-xl font-bold">{home.name}</p>
        <p className="text-sm opacity-80">
          {home.members.length} {home.members.length === 1 ? "member" : "members"}
        </p>
      </section>
      <SuccessNote message={note} />
      <ErrorNote message={error} />

      <Invite home={home} busy={busy} onResetCode={() => void resetCode()} />

      <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Members</h2>
        <ul className="flex flex-col divide-y divide-slate-200">
          {home.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {member.username}
                  {member.you && <span className="font-normal text-slate-500"> (you)</span>}
                </p>
                <p className="text-xs text-slate-500">Joined {formatWib(member.joinedAt.slice(0, 10))}</p>
              </div>
              {!member.you && (
                <button
                  type="button"
                  onClick={() => void removeMember(member)}
                  disabled={busy}
                  className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-800 active:bg-rose-50 disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Monthly budgets</h2>
        <label className="flex items-center justify-between gap-3 text-sm">
          Food and drinks
          <input
            disabled
            placeholder="Rp 3.000.000"
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right"
          />
        </label>
        <p className="text-xs text-slate-400">Budget fields will work in Milestone 9.</p>
      </section>
      <SecondaryLink to="/categories">Categories</SecondaryLink>
      <SecondaryLink to="/recurring">Recurring entries</SecondaryLink>

      <AccountSection />

      <button
        type="button"
        onClick={() => void leave()}
        disabled={busy}
        className="rounded-xl border border-rose-300 px-4 py-3 font-semibold text-rose-800 active:bg-rose-50 disabled:opacity-60"
      >
        Leave this home
      </button>
    </Screen>
  );
}

/** The home code and invite link, with Copy and Share, and Reset home code. */
function Invite({ home, busy, onResetCode }: { home: HomeSettings; busy: boolean; onResetCode: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const link = inviteLink(window.location.origin, home.code);
  const message = inviteMessage(home.name, link);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("Link copied.");
    } catch {
      setStatus("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  async function share() {
    setStatus(null);
    // Phones open their share menu (WhatsApp is in it); elsewhere WhatsApp's own share page opens.
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch (failure) {
        if (!(failure instanceof DOMException && failure.name === "AbortError")) setStatus("Couldn't share. Use Copy link instead.");
      }
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
      <h2 className="text-sm font-semibold">Invite your family</h2>
      <p className="text-sm text-slate-600">Send them the invite link. They sign up with their own username, then join.</p>
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
        <p className="text-xs text-slate-500">Home code</p>
        <p className="select-all font-mono text-xl font-bold tracking-wider">{formatHomeCode(home.code)}</p>
        <p className="mt-1 select-all break-all text-xs text-slate-500">{link}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void copy()} className={secondaryButton}>
          Copy link
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white active:bg-brand-600"
        >
          Share
        </button>
      </div>
      {status && (
        <p role="status" className="text-center text-sm text-slate-600">
          {status}
        </p>
      )}
      <button type="button" onClick={onResetCode} disabled={busy} className={secondaryButton}>
        Reset home code
      </button>
      <p className="text-xs text-slate-500">If the link reached the wrong person, reset the code: old links stop working.</p>
    </section>
  );
}
