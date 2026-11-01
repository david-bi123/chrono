import * as React from "react";
import { AlertCircle, ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputBase =
  "flex w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-base text-neutral-900 shadow-xs outline-none transition-colors duration-150 placeholder:text-neutral-500 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 sm:text-sm";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cn(inputBase, "h-9", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputBase, "min-h-[88px] resize-y py-2.5 leading-relaxed", className)}
        {...props}
      />
    );
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(inputBase, "h-9 cursor-pointer appearance-none pr-9", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden
        />
      </div>
    );
  }
);

export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn(inputBase, "h-9 pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition-colors hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

export function Label({ className, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-neutral-700", className)} {...props}>
      {props.children}
      {required && (
        <>
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const uid = React.useId();
  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // Wire the field's hint/error to the control so assistive tech announces it.
  let control = children;
  if (React.isValidElement(children)) {
    const el = children as React.ReactElement<Record<string, unknown>>;
    const existing = el.props["aria-describedby"];
    control = React.cloneElement(el, {
      "aria-describedby": describedBy
        ? existing
          ? `${String(existing)} ${describedBy}`
          : describedBy
        : existing,
      "aria-invalid": error ? true : el.props["aria-invalid"],
    });
  }

  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {control}
      {error ? <FieldError id={errorId} message={error} /> : hint ? <Hint id={hintId}>{hint}</Hint> : null}
    </div>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-red-600" role="alert">
      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-red-600" aria-hidden />
      {message}
    </p>
  );
}

export function Hint({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} className={cn("mt-1.5 text-[13px] leading-relaxed text-neutral-500", className)}>
      {children}
    </p>
  );
}

/**
 * Form-level error summary. Render it at the TOP of a form: it announces the
 * failure via `role="alert"` and takes focus so keyboard and screen-reader
 * users land on the problem rather than hunting for it.
 */
export function FormAlert({ message, className }: { message?: string; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-snug text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
