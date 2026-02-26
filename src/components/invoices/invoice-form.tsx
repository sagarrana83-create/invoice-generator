"use client";

import { useMemo, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
};

type InvoiceFormProps = {
  clients: ClientOption[];
  action: (formData: FormData) => Promise<void>;
};

type FormItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const emptyItem: FormItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

export function InvoiceForm({ clients, action }: InvoiceFormProps) {
  const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);
  const [taxRate, setTaxRate] = useState(0);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = (subtotal * taxRate) / 100;

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }, [items, taxRate]);

  const updateItem = (index: number, field: keyof FormItem, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "description") {
          return { ...item, description: value };
        }

        return {
          ...item,
          [field]: Number(value) || 0,
        };
      }),
    );
  };

  return (
    <form action={action} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
          <select
            name="clientId"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.email ? `(${client.email})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue="draft"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Issue date</label>
          <input
            type="date"
            name="issueDate"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
          <input
            type="date"
            name="dueDate"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tax rate (%)</label>
          <input
            type="number"
            name="taxRate"
            step="0.01"
            min="0"
            max="100"
            value={taxRate}
            onChange={(event) => setTaxRate(Number(event.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Line items</h2>
          <button
            type="button"
            onClick={() => setItems((current) => [...current, { ...emptyItem }])}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Add item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </label>
              <input
                required
                value={item.description}
                onChange={(event) => updateItem(index, "description", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Qty
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={item.quantity}
                onChange={(event) => updateItem(index, "quantity", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Unit Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={item.unitPrice}
                onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex items-end justify-between gap-3">
              <div className="w-full">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Line Total
                </label>
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>

              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}

        <input type="hidden" name="items" value={JSON.stringify(items)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Optional notes for this invoice"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">Subtotal: ${totals.subtotal.toFixed(2)}</p>
        <p className="mt-1 text-sm text-slate-600">Tax: ${totals.taxAmount.toFixed(2)}</p>
        <p className="mt-2 text-base font-semibold text-slate-900">Total: ${totals.total.toFixed(2)}</p>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Create invoice
      </button>
    </form>
  );
}
