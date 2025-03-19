import * as React from "react";

import { cn } from "~/lib/utils";
import { useId } from "react";
import { Label } from "./label";
import type { LucideIcon } from "lucide-react";

function Input({
  className,
  rootClassName,
  type,
  label,
  icon: Icon,
  error,
  ...props
}: React.ComponentProps<"input"> & {
  icon?: LucideIcon;
  rootClassName?: string;
  label?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={cn("*:not-first:mt-2", rootClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          type={type}
          id={id}
          data-slot="input"
          className={cn(
            "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            // "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className,
            Icon && "peer ps-8.5",
            error &&
              "focus-visible:ring-destructive/50 focus-visible:border-destructive border-destructive",
          )}
          {...props}
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2.5 peer-disabled:opacity-50">
          {Icon ? <Icon size={18} /> : null}
        </div>
      </div>
      {error && <p className={cn("text-xs text-destructive mt-1")}>{error}</p>}
    </div>
  );
}

export { Input };
