import { upsertCompanyAction } from "@/app/(dashboard)/actions";
import { requireUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";

export default async function CompanySettingsPage() {
  const userId = await requireUserId();

  const company = await prisma.company.findUnique({
    where: { userId },
  });

  return (
    <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Company profile</h2>
      <p className="mt-1 text-sm text-slate-600">This information will be used for your invoices.</p>

      <form action={upsertCompanyAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Company name</label>
          <input
            name="name"
            required
            defaultValue={company?.name ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={company?.email ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            name="phone"
            defaultValue={company?.phone ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
          <textarea
            name="address"
            rows={4}
            defaultValue={company?.address ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save company profile
        </button>
      </form>
    </section>
  );
}
