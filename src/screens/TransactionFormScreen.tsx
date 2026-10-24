import { useParams } from "react-router";
import Screen from "../components/Screen.tsx";
import { DEFAULT_CATEGORIES } from "../../shared/categories.ts";

const types = ["Expense", "Income", "Transfer"];

export default function TransactionFormScreen() {
  const { id } = useParams();
  const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.kind === "expense");
  return (
    <Screen
      number={7}
      title={id ? "Edit transaction" : "Add transaction"}
      backTo="/"
      shows="Expense, Income or Transfer toggle (Expense by default), large amount field, pocket picker (From and To for a transfer), category grid (not for transfers), note, date and time, and a “Repeat every month” switch. Edit or delete your own entries only."
    >
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {types.map((t, i) => (
          <span key={t} className={`rounded-lg py-2 text-center ${i === 0 ? "bg-white shadow-sm" : "text-slate-500"}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {expenseCategories.map((c) => (
          <span key={c.name} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-1 py-2 text-center">
            <span className="text-xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="text-[11px] leading-tight text-slate-600">{c.name}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
        <span>Repeat every month</span>
        <span className="text-slate-400">Off</span>
      </div>
    </Screen>
  );
}
