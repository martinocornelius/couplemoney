import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { PASSCODE_MIN, passcodeProblem } from "../../shared/accounts.ts";
import { useAuth, useUser, type User } from "../auth/AuthContext.tsx";
import { ErrorNote, SubmitButton, SuccessNote, TextInput } from "../components/Form.tsx";
import Screen from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";

/**
 * Change passcode. Right after an admin reset it becomes "Choose a new
 * passcode": no current passcode needed, and nothing else opens until it's done.
 */
export default function PasscodeScreen() {
  const user = useUser();
  const { setUser, logOut } = useAuth();
  const navigate = useNavigate();
  const afterReset = user.mustChangePasscode;
  const backTo = user.home ? "/settings" : "/setup";

  const [current, setCurrent] = useState("");
  const [passcode, setPasscode] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem =
      (!afterReset && !current ? "Type your current passcode." : null) ??
      passcodeProblem(passcode) ??
      (passcode === repeat ? null : "The two new passcodes don't match.");
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { user: updated } = await api<{ user: User }>("/api/passcode", {
        body: { currentPasscode: afterReset ? undefined : current, newPasscode: passcode },
      });
      setUser(updated);
      if (afterReset) {
        navigate("/", { replace: true });
        return;
      }
      setCurrent("");
      setPasscode("");
      setRepeat("");
      setDone("Passcode changed. Your other devices are logged out.");
    } catch (failure) {
      setError(errorMessage(failure));
    }
    setBusy(false);
  }

  async function logOutNow() {
    setError(null);
    try {
      await logOut();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  return (
    <Screen title={afterReset ? "Choose a new passcode" : "Change passcode"} backTo={afterReset ? undefined : backTo}>
      <p className="text-sm text-slate-600">
        {afterReset
          ? "The app admin reset your passcode. Choose a new one to continue."
          : "You stay logged in here; your other devices will be logged out."}
      </p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {!afterReset && (
          <TextInput
            label="Current passcode"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
          />
        )}
        <TextInput
          label="New passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoComplete="new-password"
          hint={`At least ${PASSCODE_MIN} characters. Tip: don't use your bank PIN.`}
        />
        <TextInput
          label="Repeat new passcode"
          type="password"
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
          autoComplete="new-password"
        />
        <ErrorNote message={error} />
        <SuccessNote message={done} />
        <SubmitButton busy={busy}>{afterReset ? "Save and continue" : "Change passcode"}</SubmitButton>
      </form>
      {afterReset ? (
        <button type="button" onClick={() => void logOutNow()} className="text-sm font-semibold text-slate-500">
          Log out
        </button>
      ) : (
        done && (
          <Link to={backTo} className="text-center text-sm font-semibold text-brand-700">
            Back
          </Link>
        )
      )}
    </Screen>
  );
}
