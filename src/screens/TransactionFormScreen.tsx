import { useParams } from "react-router";
import Screen from "../components/Screen.tsx";

export default function TransactionFormScreen() {
  const { id } = useParams();
  return (
    <Screen
      number={4}
      title={id ? "Edit transaction" : "Add transaction"}
      backTo="/"
      shows="Expense or Income toggle (Expense by default), large amount field, pocket picker (remembers your last pocket), category grid, note, date and time. Save; edit or delete your own entries only."
    />
  );
}
