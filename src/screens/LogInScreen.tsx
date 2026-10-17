import { Link } from "react-router";
import Screen, { ButtonLink, Field } from "../components/Screen.tsx";

export default function LogInScreen() {
  return (
    <Screen
      number={3}
      title="Log in"
      backTo="/welcome"
      shows="Username and passcode. After an admin reset, you log in with the one-time passcode and choose a new one."
    >
      <Field label="Username" />
      <Field label="Passcode" type="password" />
      <ButtonLink to="/">Log in</ButtonLink>
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
