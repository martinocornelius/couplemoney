import GoalProgress from "../components/GoalProgress.tsx";
import Screen, { ButtonLink } from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";
import { samplePockets } from "../lib/sampleData.ts";

export default function PocketsScreen() {
  return (
    <Screen
      number={8}
      title="Pockets"
      shows="Every pocket with its type and current balance; bank pockets show the bank name and a masked account number; pockets with a savings goal show their progress. Open a pocket to see its transactions, reveal or copy an account number, or adjust the balance to match your bank app."
    >
      <ul className="flex flex-col gap-2">
        {samplePockets.map((p) => (
          <li key={p.name} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">
                  {p.type}
                  {p.bankName && ` · ${p.bankName} •••• ${p.accountLast4}`}
                </div>
              </div>
              <div className="whitespace-nowrap font-semibold">{formatRupiah(p.balance)}</div>
            </div>
            {p.goal && <GoalProgress name="Savings goal" balance={p.balance} target={p.goal.target} hint={p.goal.hint} />}
          </li>
        ))}
      </ul>
      <ButtonLink to="/pockets/new">Add a pocket</ButtonLink>
      <p className="text-xs text-slate-400">Sample numbers only.</p>
    </Screen>
  );
}
