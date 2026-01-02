'use server';

import { redirect } from "next/navigation";
import { listRuns } from "@/lib/run-store";
import { runDailyUpload } from "@/lib/agent";

export async function triggerDailyUpload(formData: FormData) {
  const keyword = formData.get("keyword")?.toString().trim();
  const region = formData.get("region")?.toString().trim() || "US";
  const dryRun = formData.get("dryRun") === "on";

  await runDailyUpload({
    overrideKeyword: keyword || undefined,
    region,
    dryRun,
  });

  redirect("/");
}

export async function getRuns() {
  return listRuns();
}
