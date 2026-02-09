import { InputHTMLAttributes } from "react";
import clsx from "clsx";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2 dark:border-slate-700 dark:bg-slate-900",
        props.className
      )}
    />
  );
}
