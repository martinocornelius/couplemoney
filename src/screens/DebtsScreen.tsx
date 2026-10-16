import Screen, { ButtonLink } from "../components/Screen.tsx";

export default function DebtsScreen() {
  return (
    <Screen
      number={7}
      title="Payables & receivables"
      shows="Two tabs: Payables (the family owes) and Receivables (owed to the family), each item's counterparty, amount and expected payment date. Overdue items in red, due within 7 days in amber, open total per tab. Mark one as paid; switch between Open and Paid."
    >
      <ButtonLink to="/debts/new">Add an item</ButtonLink>
    </Screen>
  );
}
