"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
  action: (state: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
};

const initialState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}

export function AuthForm({
  title,
  description,
  submitLabel,
  footerText,
  footerLinkLabel,
  footerLinkHref,
  action,
}: AuthFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Invoice SaaS</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring"
          />
        </div>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <SubmitButton label={submitLabel} />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {footerText}{" "}
        <Link href={footerLinkHref} className="font-medium text-indigo-600 hover:text-indigo-500">
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}
