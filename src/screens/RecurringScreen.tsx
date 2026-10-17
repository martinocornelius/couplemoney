import Screen, { ButtonLink } from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";

const sampleRules = [
  { what: "Salary", type: "Income", amount: 7500000, pockets: "BCA joint account", day: "25th", by: "martino" },
  { what: "Rent", type: "Expense", amount: 4500000, pockets: "BCA joint account", day: "1st", by: "sari" },
  { what: "Save for Bali", type: "Transfer", amount: 734000, pockets: "BCA → Bali trip 2027", day: "26th", by: "martino" },
];

export default function RecurringScreen() {
  return (
    <Screen
      number={13}
      title="Recurring entries"
      backTo="/settings"
      shows="Every monthly rule: type, amount, pocket (or From → To), category, day of the month, next date and who set it up. Edit, pause or resume, or delete (entries already recorded stay)."
    >
      <ul className="flex flex-col gap-2">
        {sampleRules.map((r) => (
          <li key={r.what} className="flex justify-between gap-2 rounded-xl bg-slate-50 p-3">
            <div>
              <div className="font-medium">{r.what}</div>
              <div className="text-xs text-slate-500">
                {r.type} · {r.pockets} · every {r.day} · by {r.by}
              </div>
            </div>
            <div className="whitespace-nowrap font-semibold">{formatRupiah(r.amount)}</div>
          </li>
        ))}
      </ul>
      <ButtonLink to="/transactions/new">Add a recurring entry</ButtonLink>
      <p className="text-xs text-slate-400">Sample entries only.</p>
    </Screen>
  );
}
