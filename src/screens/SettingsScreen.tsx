import Screen, { SecondaryLink } from "../components/Screen.tsx";

export default function SettingsScreen() {
  return (
    <Screen
      number={9}
      title="Home settings"
      shows="Home name, members, home code and invite link. Copy or share the invite link (WhatsApp-friendly text), reset the home code, remove a member, or leave the home on this device."
    >
      <SecondaryLink to="/welcome">Leave home on this device</SecondaryLink>
    </Screen>
  );
}
