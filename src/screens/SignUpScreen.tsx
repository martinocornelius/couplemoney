import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { normalizeUsername, PASSCODE_MIN, passcodeProblem, USERNAME_RULE, usernameProblem } from "../../shared/accounts.ts";
import { useAuth, type User } from "../auth/AuthContext.tsx";
import { nextPage, withNext } from "../auth/next.ts";
import { ErrorNote, SubmitButton, TextInput } from "../components/Form.tsx";
import Screen from "../components/Screen.tsx";
import { api, errorMessage } from "../lib/api.ts";

export default function SignUpScreen() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const next = nextPage(useLocation().search);
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = normalizeUsername(username);
    const problem =
      usernameProblem(name) ?? passcodeProblem(passcode) ?? (passcode === repeat ? null : "The two passcodes don't match.");
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: User }>("/api/signup", { body: { username: name, passcode } });
      setUser(user);
      navigate(next ?? "/", { replace: true });
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <Screen title="Sign up" backTo={next ?? "/welcome"}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextInput
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          hint={`${USERNAME_RULE[0].toUpperCase()}${USERNAME_RULE.slice(1)}. The people in your home will see it.`}
        />
        <TextInput
          label="Passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoComplete="new-password"
          hint={`At least ${PASSCODE_MIN} characters. Tip: don't use your bank PIN.`}
        />
        <TextInput
          label="Repeat passcode"
          type="password"
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
          autoComplete="new-password"
        />
        <ErrorNote message={error} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to={withNext("/login", next)} className="font-semibold text-brand-700">
          Log in
        </Link>
      </p>
    </Screen>
  );
}
