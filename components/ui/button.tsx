import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white shadow-soft hover:bg-neutral-800",
        secondary: "bg-white text-neutral-900 border border-neutral-200 shadow-soft hover:bg-neutral-50",
        outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100",
        ghost: "hover:bg-neutral-100 text-neutral-600",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-soft",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[13px] rounded-lg",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-8 text-base rounded-2xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
