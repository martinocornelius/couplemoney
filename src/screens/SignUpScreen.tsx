import { Link } from "react-router";
import Screen, { ButtonLink, Field } from "../components/Screen.tsx";

export default function SignUpScreen() {
  return (
    <Screen
      number={2}
      title="Sign up"
      backTo="/welcome"
      shows="Username, passcode and repeat passcode, with a tip not to reuse your bank PIN. Create the account, or switch to Log in."
    >
      <Field label="Username" placeholder="e.g. martino" />
      <Field label="Passcode" type="password" placeholder="6 or more characters" />
      <Field label="Repeat passcode" type="password" />
      <p className="text-xs text-slate-500">Tip: don't use your bank PIN as your passcode.</p>
      <ButtonLink to="/setup">Create account</ButtonLink>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700">
          Log in
        </Link>
      </p>
    </Screen>
  );
}
