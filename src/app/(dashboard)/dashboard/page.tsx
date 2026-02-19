export default function DashboardPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Your workspace is ready</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Authentication and protected routing are active. Phase 2 can now safely build invoice
        creation, listing, and client workflows inside this secured dashboard.
      </p>
    </section>
  );
}
