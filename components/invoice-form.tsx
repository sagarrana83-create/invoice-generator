"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";

type Item = { name: string; description: string; quantity: number; price: number };

type InvoicePayload = {
  id?: string;
  companyName: string;
  companyLogo: string | null;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  taxId: string;
  client: { name: string; email: string; address: string };
  invoiceDate: string;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  taxPercent: number;
  discount: number;
  notes: string;
  terms: string;
  items: Item[];
};

const empty: InvoicePayload = {
  companyName: "",
  companyLogo: null,
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  taxId: "",
  client: { name: "", email: "", address: "" },
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  status: "PENDING",
  taxPercent: 0,
  discount: 0,
  notes: "",
  terms: "",
  items: [{ name: "", description: "", quantity: 1, price: 0 }]
};

export function InvoiceForm({ initial }: { initial?: InvoicePayload }) {
  const [form, setForm] = useState<InvoicePayload>(initial || empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const subtotal = useMemo(
    () => form.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [form.items]
  );
  const taxAmount = useMemo(() => subtotal * (form.taxPercent / 100), [subtotal, form.taxPercent]);
  const total = useMemo(
    () => Math.max(subtotal + taxAmount - form.discount, 0),
    [subtotal, taxAmount, form.discount]
  );

  function updateItem(index: number, patch: Partial<Item>) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }

  async function submit() {
    setLoading(true);
    setError("");

    if (!form.items.length) {
      setError("Invoice must include at least one item.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      discount: Number(form.discount),
      taxPercent: Number(form.taxPercent),
      items: form.items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        price: Number(i.price)
      }))
    };

    const endpoint = form.id ? `/api/invoices/${form.id}` : "/api/invoices";
    const method = form.id ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save invoice");
        setLoading(false);
        return;
      }

      router.push("/invoices");
      router.refresh();
    } catch {
      setError("Unexpected network error.");
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-semibold">Company details</h2>
          <Input
            placeholder="Company name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <Input
            placeholder="Address"
            value={form.companyAddress}
            onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={form.companyEmail}
            onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
          />
          <Input
            placeholder="Phone"
            value={form.companyPhone}
            onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
          />
          <Input
            placeholder="GST / Tax ID (optional)"
            value={form.taxId}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setForm((prev) => ({ ...prev, companyLogo: String(reader.result) }));
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Client & Invoice details</h2>
          <Input
            placeholder="Client name"
            value={form.client.name}
            onChange={(e) => setForm({ ...form, client: { ...form.client, name: e.target.value } })}
          />
          <Input
            placeholder="Client email"
            value={form.client.email}
            onChange={(e) => setForm({ ...form, client: { ...form.client, email: e.target.value } })}
          />
          <Input
            placeholder="Client address"
            value={form.client.address}
            onChange={(e) => setForm({ ...form, client: { ...form.client, address: e.target.value } })}
          />
          <Input
            type="date"
            value={form.invoiceDate}
            onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
          />
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as InvoicePayload["status"] })}
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Items</h2>
        {form.items.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} />
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              value={item.price}
              onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
            />
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              ${(item.quantity * item.price).toFixed(2)}
              <button
                className="text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={form.items.length <= 1}
                onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          className="rounded-lg border px-3 py-2"
          type="button"
          onClick={() =>
            setForm({
              ...form,
              items: [...form.items, { name: "", description: "", quantity: 1, price: 0 }]
            })
          }
        >
          Add Item
        </button>
      </div>

      <div className="card grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Textarea rows={4} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Textarea rows={4} placeholder="Terms & Conditions" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
        </div>
        <div className="space-y-3">
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            placeholder="Tax %"
            value={form.taxPercent}
            onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Discount"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
          />
          <div className="rounded-lg border p-3 text-sm">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Tax: ${taxAmount.toFixed(2)}</p>
            <p>Discount: ${form.discount.toFixed(2)}</p>
            <p className="mt-2 text-lg font-semibold">Total: ${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button
        onClick={submit}
        disabled={loading}
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : form.id ? "Update Invoice" : "Create Invoice"}
      </button>
    </section>
  );
}
