import type { Metadata } from "next";
import { getEnv } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice SaaS",
  description: "Production-ready invoice SaaS platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  getEnv();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
