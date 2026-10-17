import { useParams } from "react-router";
import Screen, { Field } from "../components/Screen.tsx";

export default function PocketFormScreen() {
  const { id } = useParams();
  return (
    <Screen
      number={9}
      title={id ? "Edit pocket" : "Add pocket"}
      backTo="/pockets"
      shows="Name, type (Bank account, Cash, E-wallet, Other) and opening balance. Bank name and account number fields appear only when the type is Bank account. Optional savings goal. Save; archive a pocket you no longer use."
    >
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Savings goal (optional)</h2>
        <Field label="Target amount" placeholder="Rp 20.000.000" />
        <Field label="Target date" placeholder="Dec 2027" />
      </section>
    </Screen>
  );
}
