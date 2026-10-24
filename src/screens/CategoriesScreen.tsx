import { useState } from "react";
import Screen from "../components/Screen.tsx";
import Segmented from "../components/Segmented.tsx";
import { DEFAULT_CATEGORIES, type CategoryKind } from "../../shared/categories.ts";

export default function CategoriesScreen() {
  const [kind, setKind] = useState<CategoryKind>("expense");
  const list = DEFAULT_CATEGORIES.filter((c) => c.kind === kind);

  return (
    <Screen
      number={16}
      title="Categories"
      backTo="/settings"
      shows="Your home's expense and income categories. Add your own (name + emoji), rename them, or hide the ones you don't use; built-in ones can't be renamed or hidden. Hidden ones stay in lists, charts and exports."
    >
      <Segmented
        label="Expense or income"
        value={kind}
        onChange={setKind}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
      <ul className="flex flex-col divide-y divide-slate-200 rounded-xl bg-slate-50">
        {list.map((c) => (
          <li key={c.name} className="flex items-center gap-3 px-3 py-2.5">
            <span className="text-xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="flex-1 text-sm font-medium">{c.name}</span>
            {c.builtIn ? (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Built-in</span>
            ) : (
              <button disabled className="text-xs font-semibold text-slate-400">
                Hide
              </button>
            )}
          </li>
        ))}
      </ul>
      <button disabled className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-400">
        Add a category
      </button>
      <p className="text-xs text-slate-400">The default list every new home starts with.</p>
    </Screen>
  );
}
