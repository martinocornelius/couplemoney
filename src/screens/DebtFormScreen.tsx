import { useParams } from "react-router";
import Screen from "../components/Screen.tsx";

export default function DebtFormScreen() {
  const { id } = useParams();
  return (
    <Screen
      number={8}
      title={id ? "Edit payable or receivable" : "Add payable or receivable"}
      backTo="/debts"
      shows="Payable or Receivable toggle, counterparty, amount, expected payment date and note. When marking paid, pick a pocket and date, and the matching transaction is recorded."
    />
  );
}
