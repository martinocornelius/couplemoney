import Screen, { ButtonLink } from "../components/Screen.tsx";

export default function PocketsScreen() {
  return (
    <Screen
      number={5}
      title="Pockets"
      shows="Every pocket with its type and current balance; bank pockets also show the bank name and a masked account number (•••• 1234). Open a pocket to see its transactions; reveal or copy an account number."
    >
      <ButtonLink to="/pockets/new">Add a pocket</ButtonLink>
    </Screen>
  );
}
