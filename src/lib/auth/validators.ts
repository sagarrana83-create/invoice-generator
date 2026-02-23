import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Please enter a valid email address.").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must be under 128 characters.")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
    .regex(/[a-z]/, "Password must include at least one lowercase letter.")
    .regex(/\d/, "Password must include at least one number."),
});

export type AuthInput = z.infer<typeof authSchema>;
