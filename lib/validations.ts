import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const invoiceItemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative()
});

export const invoiceSchema = z
  .object({
    client: z.object({
      name: z.string().trim().min(1),
      email: z.string().email(),
      address: z.string().trim().min(1)
    }),
    companyName: z.string().trim().min(1),
    companyLogo: z.string().nullable().optional(),
    companyAddress: z.string().trim().min(1),
    companyEmail: z.string().email(),
    companyPhone: z.string().trim().min(1),
    taxId: z.string().nullable().optional(),
    invoiceDate: z.string().date(),
    dueDate: z.string().date(),
    status: z.enum(["PAID", "PENDING", "OVERDUE"]),
    items: z.array(invoiceItemSchema).min(1),
    taxPercent: z.number().min(0).max(100),
    discount: z.number().min(0),
    notes: z.string().nullable().optional(),
    terms: z.string().nullable().optional()
  })
  .superRefine((value, ctx) => {
    const invoiceDate = new Date(value.invoiceDate);
    const dueDate = new Date(value.dueDate);

    if (Number.isNaN(invoiceDate.valueOf()) || Number.isNaN(dueDate.valueOf())) {
      ctx.addIssue({ code: "custom", message: "Invalid invoice date or due date" });
      return;
    }

    if (dueDate < invoiceDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be earlier than invoice date"
      });
    }
  });
