import { useParams } from "react-router";
import Screen, { ButtonLink } from "../components/Screen.tsx";

export default function JoinScreen() {
  const { code } = useParams();
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white">
      <Screen
        number={2}
        title="Join a home"
        backTo="/welcome"
        shows="Opened from an invite link. Shows the home's name and its existing members. Pick your name if you joined before on another device, or type a new name, then tap Join."
      >
        <p className="text-sm text-slate-500">Home code from the link: {code}</p>
        <ButtonLink to="/">Join</ButtonLink>
      </Screen>
    </div>
  );
}
