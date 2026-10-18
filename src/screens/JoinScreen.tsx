import { useParams } from "react-router";
import Screen, { ButtonLink } from "../components/Screen.tsx";

export default function JoinScreen() {
  const { code } = useParams();
  return (
    <Screen
      number={5}
      title="Join a home"
      backTo="/setup"
      shows="Opened from an invite link or after entering a home code. Shows the home's name and its members. If you aren't logged in yet, you sign up or log in first and come back here."
    >
      <div className="rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-semibold">Our home</p>
        <p className="text-slate-500">Members: martino, sari</p>
        <p className="text-xs text-slate-400">Code from the link: {code}</p>
      </div>
      <ButtonLink to="/">Join</ButtonLink>
    </Screen>
  );
}
