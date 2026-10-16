import type { ReactNode } from "react";
import { Link } from "react-router";

type ScreenProps = {
  number: number;
  title: string;
  /** What the finished screen will show, from SPEC.md. */
  shows: string;
  backTo?: string;
  children?: ReactNode;
};

/** Placeholder layout shared by all nine screens until each one is built. */
export default function Screen({ number, title, shows, backTo, children }: ScreenProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-3">
        {backTo && (
          <Link to={backTo} aria-label="Back" className="text-2xl text-slate-500">
            ←
          </Link>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-semibold">Screen {number} (placeholder).</span> {shows}
      </p>
      {children}
    </div>
  );
}

export function ButtonLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white active:bg-brand-600"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700 active:bg-slate-50"
    >
      {children}
    </Link>
  );
}
