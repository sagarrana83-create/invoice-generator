"use client";

import { useFormStatus } from "react-dom";

type PayNowButtonProps = {
  invoiceId: string;
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecting..." : "Pay Now"}
    </button>
  );
}

export function PayNowButton({ invoiceId, action }: PayNowButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <SubmitButton />
    </form>
  );
}
