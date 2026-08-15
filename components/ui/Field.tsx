import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function TextInput({ label, className, id, ...props }: FieldProps) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</span>}
      <input
        id={id}
        className={clsx(
          "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500",
          "placeholder:text-slate-400 dark:placeholder:text-slate-600",
          className
        )}
        {...props}
      />
    </label>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className, id, ...props }: AreaProps) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</span>}
      <textarea
        id={id}
        className={clsx(
          "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 resize-y transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 dark:focus:border-slate-500",
          "placeholder:text-slate-400 dark:placeholder:text-slate-600",
          className
        )}
        {...props}
      />
    </label>
  );
}
