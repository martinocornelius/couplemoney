import { ButtonLink } from "../components/Screen.tsx";

export default function NotFoundScreen() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Page not found</h1>
      <ButtonLink to="/">Go to Home</ButtonLink>
    </div>
  );
}
