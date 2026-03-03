import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/errors";
import { runOverdueInvoiceJob } from "@/lib/jobs/overdue-job";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const { CRON_SECRET } = getEnv();

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOverdueInvoiceJob();
    return NextResponse.json(result);
  } catch (error) {
    logServerError("overdue-job", error);
    return NextResponse.json({ message: "Failed to run overdue job" }, { status: 500 });
  }
}
