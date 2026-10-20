import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";

type ScreenProps = {
  title: string;
  /** Only for screens not built yet: their number and what they will show, from SPEC.md. */
  number?: number;
  shows?: string;
  backTo?: string;
  children?: ReactNode;
};

/** The layout every screen shares. Screens not built yet also show a placeholder note. */
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
      {shows && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-semibold">Screen {number} (placeholder).</span> {shows}
        </p>
      )}
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

/** Disabled form field for placeholder screens; becomes a real input when the screen is built. */
export function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        disabled
        type={type}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
      />
    </label>
  );
}

/** Wrapper for screens shown before joining a home (no tab bar). */
export function PublicLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white">
      <Outlet />
    </div>
  );
}
