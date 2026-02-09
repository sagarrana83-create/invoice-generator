import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold tracking-tight">Invoice Generator</h1>
      <p className="text-slate-600 dark:text-slate-300">
        A production-ready invoice platform with authentication, dashboard analytics, CRUD workflows, and PDF exports.
      </p>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark" href="/signup">
          Create account
        </Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 font-medium" href="/login">
          Login
        </Link>
      </div>
    </main>
  );
}
