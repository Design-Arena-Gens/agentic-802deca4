import Replicate from "replicate";
import { env, assertEnv } from "./env";
import { ScriptResult, TrendIdea, VideoGenerationResult } from "./types";

const replicateClient =
  env.REPLICATE_API_TOKEN &&
  new Replicate({
    auth: env.REPLICATE_API_TOKEN,
  });

export async function generateVideoAsset(
  idea: TrendIdea,
  script: ScriptResult,
): Promise<VideoGenerationResult> {
  assertEnv(["REPLICATE_API_TOKEN"]);
  if (!replicateClient) {
    throw new Error("Replicate client is not configured.");
  }

  const prompt = [
    script.hook,
    "Create an eye-catching short-form 9:16 video with high energy visuals.",
    "Focus on motion graphics, animated typography, and kinetic transitions that match the narration pacing.",
    "Avoid watermarks or text overlays that clash with captions.",
  ].join(" ");

  type ReplicateOutput =
    | string[]
    | {
        output?: string[];
        video?: string;
        urls?: string[];
        [key: string]: unknown;
      };

  const modelIdentifier =
    env.REPLICATE_MODEL as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

  const output = (await replicateClient.run(modelIdentifier, {
    input: {
      prompt,
      fps: 24,
      guidance_scale: 3.5,
      duration: 6,
      aspect_ratio: "9:16",
      negative_prompt:
        "low quality, low resolution, blurry, watermark, text overlay, static frame",
    },
  })) as ReplicateOutput;

  let videoUrl: string | undefined;
  if (Array.isArray(output)) {
    videoUrl = output.at(-1);
  } else {
    const candidateOutputs = output.output ?? output.urls ?? [];
    videoUrl =
      (Array.isArray(candidateOutputs) ? candidateOutputs.at(-1) : undefined) ??
      output.video;
  }

  if (!videoUrl) {
    throw new Error("Replicate did not return a video output URL.");
  }

  return {
    videoUrl,
    provider: env.REPLICATE_MODEL,
    raw: output,
  };
}
