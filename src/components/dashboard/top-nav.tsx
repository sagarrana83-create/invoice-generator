import { logoutAction } from "@/app/(auth)/actions";

type TopNavProps = {
  email: string;
};

export function TopNav({ email }: TopNavProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Authenticated workspace</p>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-slate-600 sm:block">{email}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
