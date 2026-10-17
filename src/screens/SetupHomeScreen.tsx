import Screen, { ButtonLink, Field, SecondaryLink } from "../components/Screen.tsx";

export default function SetupHomeScreen() {
  return (
    <Screen
      number={4}
      title="Create or join a home"
      shows="Shown after logging in when your account isn't in a home yet. Create a home, or enter the home code someone shared with you."
    >
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Create a home</h2>
        <Field label="Home name" placeholder="e.g. Our home" />
        <ButtonLink to="/">Create home</ButtonLink>
      </section>
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Join a home</h2>
        <Field label="Home code" placeholder="XXXX-XXXX-XXXX" />
        <SecondaryLink to="/join/DEMO-CODE-1234">Continue</SecondaryLink>
      </section>
    </Screen>
  );
}
