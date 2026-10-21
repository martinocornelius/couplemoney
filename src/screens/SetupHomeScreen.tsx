import { useUser } from "../auth/AuthContext.tsx";
import AccountSection from "../components/AccountSection.tsx";
import Screen, { Field } from "../components/Screen.tsx";

const disabledButton = "rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white disabled:opacity-40";

/** Where an account that isn't in a home lands after logging in. Creating and joining come in Milestone 4. */
export default function SetupHomeScreen() {
  const user = useUser();
  return (
    <Screen title="Create or join a home">
      <p className="text-sm text-slate-600">
        Welcome, {user.username}! Create a home for your family, or join one with the home code someone shared with you.
      </p>
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Create a home</h2>
        <Field label="Home name" placeholder="e.g. Our home" />
        <button type="button" disabled className={disabledButton}>
          Create home
        </button>
      </section>
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Join a home</h2>
        <Field label="Home code" placeholder="XXXX-XXXX-XXXX" />
        <button type="button" disabled className={disabledButton}>
          Continue
        </button>
      </section>
      <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
        Creating and joining a home start working in Milestone 4.
      </p>
      <AccountSection />
    </Screen>
  );
}
