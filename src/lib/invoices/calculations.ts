export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceTotals = {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  normalizedItems: Array<InvoiceItemInput & { lineTotal: number }>;
};

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateInvoiceTotals(items: InvoiceItemInput[], taxRate: number): InvoiceTotals {
  const normalizedItems = items.map((item) => {
    const quantity = roundCurrency(item.quantity);
    const unitPrice = roundCurrency(item.unitPrice);
    const lineTotal = roundCurrency(quantity * unitPrice);

    return {
      description: item.description.trim(),
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const subtotal = roundCurrency(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const taxAmount = roundCurrency((subtotal * taxRate) / 100);
  const totalAmount = roundCurrency(subtotal + taxAmount);

  return {
    subtotal,
    taxAmount,
    totalAmount,
    normalizedItems,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
