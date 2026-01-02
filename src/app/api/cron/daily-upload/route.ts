import { NextRequest } from "next/server";
import { runDailyUpload } from "@/lib/agent";

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? "US";
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  const run = await runDailyUpload({
    region,
    dryRun,
  });

  return Response.json({
    ok: true,
    run,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
