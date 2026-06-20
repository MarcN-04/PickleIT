import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

/**
 * Glass-styled text input for forms (add/edit player, auth, etc.).
 * Pill-shaped with a soft focus ring in the brand emerald.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="px-1 text-xs font-medium text-ink/70"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-full border border-white/70 bg-white/65 px-4 py-2.5 text-sm text-ink",
          "placeholder:text-ink/40",
          "outline-none transition-shadow focus:border-primary/40 focus:shadow-glow-primary",
          className
        )}
        {...props}
      />
    </div>
  );
});
