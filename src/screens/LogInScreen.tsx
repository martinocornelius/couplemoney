import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { normalizeUsername } from "../../shared/accounts.ts";
import { useAuth, type User } from "../auth/AuthContext.tsx";
import { ErrorNote, SubmitButton, TextInput } from "../components/Form.tsx";
import Screen from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";

export default function LogInScreen() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !passcode) {
      setError("Type your username and passcode.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: User }>("/api/login", { body: { username: normalizeUsername(username), passcode } });
      setUser(user);
      // After an admin reset, the guards send the account to choose a new passcode.
      navigate(user.mustChangePasscode ? "/passcode" : "/", { replace: true });
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <Screen title="Log in" backTo="/welcome">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextInput
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <TextInput
          label="Passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoComplete="current-password"
        />
        <ErrorNote message={error} />
        <SubmitButton busy={busy}>Log in</SubmitButton>
      </form>
      <p className="text-center text-sm text-slate-600">Forgot your passcode? Ask the app admin to reset it.</p>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-brand-700">
          Sign up
        </Link>
      </p>
    </Screen>
  );
}
