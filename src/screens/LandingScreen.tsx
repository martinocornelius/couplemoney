import Screen, { ButtonLink, SecondaryLink } from "../components/Screen.tsx";

export default function LandingScreen() {
  return (
    <Screen title="Couple Money">
      <div className="rounded-2xl bg-brand-50 p-6 text-center">
        <p className="text-2xl font-bold text-brand-700">Track money together.</p>
        <p className="text-2xl font-bold text-brand-700">Save for your dreams.</p>
        <p className="mt-2 text-sm text-slate-600">See where every rupiah comes from and goes, with everyone in your home.</p>
      </div>
      <ButtonLink to="/signup">Sign up</ButtonLink>
      <SecondaryLink to="/login">Log in</SecondaryLink>
    </Screen>
  );
}
