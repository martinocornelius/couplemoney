import Screen, { SecondaryLink } from "../components/Screen.tsx";

export default function SettingsScreen() {
  return (
    <Screen
      number={12}
      title="Home settings"
      shows="Home name, members, home code, invite link and monthly budget per expense category. Copy or share the invite link (WhatsApp-friendly text), reset the home code, remove a member, set budgets, manage categories, change your passcode, log out, or leave the home."
    >
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
      <SecondaryLink to="/admin">Admin (app admin only)</SecondaryLink>
      <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-sm">
        <h2 className="font-semibold">Your account</h2>
        <p className="text-slate-500">Logged in as martino</p>
        <button disabled className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-400">
          Change passcode
        </button>
      </section>
      <SecondaryLink to="/welcome">Log out</SecondaryLink>
      <SecondaryLink to="/setup">Leave this home</SecondaryLink>
    </Screen>
  );
}
