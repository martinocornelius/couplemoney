import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type TextInputProps = { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>;

/** A labelled input. 16px text, so phones don't zoom in when it's tapped. The hint is read out after the label. */
export function TextInput({ label, hint, ...props }: TextInputProps) {
  const hintId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {label}
        <input
          {...props}
          aria-describedby={hint ? hintId : undefined}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </label>
      {hint && (
        <span id={hintId} className="text-xs text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white active:bg-brand-600 disabled:opacity-60"
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
      {message}
    </p>
  );
}

export function SuccessNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {message}
    </p>
  );
}
