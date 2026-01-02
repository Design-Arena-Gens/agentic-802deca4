import { createRun, appendLog, completeRun, updateRun } from "./run-store";
import { fetchTrendingTopics } from "./trends";
import { generateVideoScript } from "./script-generator";
import { generateVideoAsset } from "./video-generator";
import { uploadVideoToYoutube } from "./youtube";
import { AgentRun, TrendIdea } from "./types";

type AgentOptions = {
  region?: string;
  overrideKeyword?: string;
  dryRun?: boolean;
};

async function chooseTrendIdea(
  runId: string,
  options: AgentOptions,
): Promise<TrendIdea> {
  if (options.overrideKeyword) {
    appendLog(runId, "info", "Using override keyword for upload.", {
      keyword: options.overrideKeyword,
    });
    return {
      keyword: options.overrideKeyword,
      score: 100,
      description: "Manual override keyword supplied via dashboard.",
      region: options.region ?? "US",
    };
  }

  appendLog(runId, "info", "Fetching Google Trends data.");
  const ideas = await fetchTrendingTopics(options.region);

  if (!ideas.length) {
    throw new Error("No trending topics found.");
  }

  const [best] = ideas.sort((a, b) => b.score - a.score);
  appendLog(runId, "success", "Selected trending topic.", {
    keyword: best.keyword,
    score: best.score,
  });
  return best;
}

export async function runDailyUpload(
  options: AgentOptions = {},
): Promise<AgentRun> {
  const run = createRun();

  try {
    const idea = await chooseTrendIdea(run.id, options);
    updateRun(run.id, (current) => ({ ...current, topic: idea }));

    appendLog(run.id, "info", "Generating viral-ready script with OpenAI.");
    const script = await generateVideoScript(idea);
    updateRun(run.id, (current) => ({ ...current, script }));
    appendLog(run.id, "success", "Script generated.");

    appendLog(run.id, "info", "Generating motion video asset with Replicate.");
    const video = await generateVideoAsset(idea, script);
    updateRun(run.id, (current) => ({ ...current, video }));
    appendLog(run.id, "success", "Video generated.", {
      videoUrl: video.videoUrl,
    });

    if (options.dryRun) {
      appendLog(run.id, "warn", "Dry run enabled; skipping YouTube upload.");
      completeRun(run.id, {
        upload: {
          status: "skipped",
          message: "Dry run mode: upload skipped.",
        },
      });
      return updateRun(run.id, (current) => current)!;
    }

    appendLog(run.id, "info", "Uploading video to YouTube.");
    const upload = await uploadVideoToYoutube(script, video);
    appendLog(run.id, upload.status === "success" ? "success" : "error", upload.status === "success" ? "Video uploaded to YouTube." : "Video upload failed.", upload);

    completeRun(run.id, {
      upload,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown agent failure.";
    appendLog(run.id, "error", message);
    completeRun(run.id, {
      error: message,
    });
  }

  return updateRun(run.id, (current) => current)!;
}
