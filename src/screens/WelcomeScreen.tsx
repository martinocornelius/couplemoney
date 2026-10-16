import Screen, { ButtonLink, SecondaryLink } from "../components/Screen.tsx";

export default function WelcomeScreen() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white">
      <Screen
        number={1}
        title="Welcome to Couple Money"
        shows="Shown when this browser hasn't joined a home yet. Create a new home (home name + your name) or enter a home code."
      >
        <ButtonLink to="/">Create a new home</ButtonLink>
        <SecondaryLink to="/join/DEMOCODE1234">Enter a home code</SecondaryLink>
      </Screen>
    </div>
  );
}
