import { useParams } from "react-router";
import Screen from "../components/Screen.tsx";

export default function PocketFormScreen() {
  const { id } = useParams();
  return (
    <Screen
      number={6}
      title={id ? "Edit pocket" : "Add pocket"}
      backTo="/pockets"
      shows="Name, type (Bank account, Cash, E-wallet, Other) and opening balance. Bank name and account number fields appear only when the type is Bank account. Save; archive a pocket you no longer use."
    />
  );
}
