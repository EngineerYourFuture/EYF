import { type ReactNode } from "react";
import { cn } from "./cn";

export type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Labelled form-field wrapper. The label WRAPS its control, giving an implicit,
 * programmatic association (no id/htmlFor plumbing) so assistive tech announces
 * the field name. Use for any single labelled input/select/textarea/custom control.
 *
 * This is the canonical primitive — several screens previously hand-rolled a
 * label as a *sibling* of the input (no association, a WCAG failure). Prefer
 * this (or TextField) so that bug can't recur.
 */
export function Field({ label, hint, children, className }: Readonly<FieldProps>) {
  return (
    <label className={cn("block", className)}>
      <span className="text-text-3 text-xs uppercase tracking-wider">
        {label}
        {hint && <span className="text-text-4 normal-case tracking-normal"> · {hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export type TextFieldProps = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: ReactNode;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

/** A labelled text `<input>` built on Field — the common single-line case. */
export function TextField({
  label, value, onChange, type = "text", hint, placeholder, className, inputClassName,
}: Readonly<TextFieldProps>) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent",
          inputClassName,
        )}
      />
    </Field>
  );
}
