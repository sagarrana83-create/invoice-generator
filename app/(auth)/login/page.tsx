import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="card w-full space-y-5">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <AuthForm mode="login" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No account? <Link className="text-brand" href="/signup">Sign up</Link>
        </p>
      </section>
    </main>
  );
}
