import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const key = parsed.error.errors[0]?.path.join(".") ?? "environment";
    throw new Error(`Invalid environment configuration: ${key}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
