import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { formatHomeCode, HOME_NAME_MAX, homeNameProblem, normalizeHomeCode } from "../../shared/homes.ts";
import { useAuth, useUser, type User } from "../auth/AuthContext.tsx";
import AccountSection from "../components/AccountSection.tsx";
import { ErrorNote, SubmitButton, TextInput } from "../components/Form.tsx";
import Screen from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";

/** Where an account that isn't in a home lands after logging in. */
export default function SetupHomeScreen() {
  const user = useUser();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);

  // Already in a home (say, opened from the browser's history): go to it.
  // Not right after creating one, though: that goes to Home settings.
  if (user.home && !created) return <Navigate to="/" replace />;

  async function create(event: FormEvent) {
    event.preventDefault();
    const problem = homeNameProblem(name);
    if (problem) {
      setCreateError(problem);
      return;
    }
    setBusy(true);
    setCreateError(null);
    try {
      const { user: updated } = await api<{ user: User }>("/api/homes", { body: { name: name.trim() } });
      setCreated(true);
      setUser(updated);
      navigate("/settings", { replace: true, state: { created: true } });
    } catch (failure) {
      setCreateError(errorMessage(failure));
      setBusy(false);
    }
  }

  function join(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeHomeCode(code);
    if (!normalized) {
      setJoinError("Home codes have 12 letters and numbers, like ABCD-EFGH-JKLM.");
      return;
    }
    navigate(`/join/${formatHomeCode(normalized)}`);
  }

  return (
    <Screen title="Create or join a home">
      <p className="text-sm text-slate-600">
        Welcome, {user.username}! Create a home for your family, or join one with the home code someone shared with you.
      </p>
      <form onSubmit={create} noValidate className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Create a home</h2>
        <TextInput
          label="Home name"
          placeholder="e.g. Keluarga Martino"
          value={name}
          maxLength={HOME_NAME_MAX}
          onChange={(event) => setName(event.target.value)}
        />
        <ErrorNote message={createError} />
        <SubmitButton busy={busy}>Create home</SubmitButton>
      </form>
      <form onSubmit={join} noValidate className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Join a home</h2>
        <TextInput
          label="Home code"
          placeholder="XXXX-XXXX-XXXX"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          hint="Or open the invite link someone sent you."
        />
        <ErrorNote message={joinError} />
        <button
          type="submit"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 active:bg-slate-100"
        >
          Continue
        </button>
      </form>
      <AccountSection />
    </Screen>
  );
}
