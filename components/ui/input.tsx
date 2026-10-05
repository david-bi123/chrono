import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputBase =
  "flex w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 shadow-xs outline-none transition-colors duration-150 placeholder:text-neutral-500 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

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

export function Label({ className, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 block text-[13px] font-medium text-neutral-700", className)} {...props}>
      {props.children}
      {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
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
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-red-600" role="alert">
      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-red-600" aria-hidden />
      {message}
    </p>
  );
}

export function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1.5 text-xs leading-relaxed text-neutral-500", className)}>{children}</p>;
}
