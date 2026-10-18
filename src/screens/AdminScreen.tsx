import Screen, { Field } from "../components/Screen.tsx";

export default function AdminScreen() {
  return (
    <Screen
      number={15}
      title="Admin"
      backTo="/settings"
      shows="Only for the app admin. Find an account by username and reset a forgotten passcode: the app shows a one-time passcode once, valid for 24 hours. Passcodes and homes' money are never shown here."
    >
      <Field label="Find an account" placeholder="Username" />
      <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="font-medium">sari</div>
        <div className="text-xs text-slate-500">Account made 12 Oct 2026 · not locked</div>
        <button disabled className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-400">
          Reset passcode
        </button>
      </div>
    </Screen>
  );
}
