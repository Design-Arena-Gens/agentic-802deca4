import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required").optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  REPLICATE_API_TOKEN: z
    .string()
    .min(1, "REPLICATE_API_TOKEN is required")
    .optional(),
  REPLICATE_MODEL: z
    .string()
    .default("black-forest-labs/flux-video"),
  YOUTUBE_CLIENT_ID: z.string().min(1, "YOUTUBE_CLIENT_ID is required").optional(),
  YOUTUBE_CLIENT_SECRET: z
    .string()
    .min(1, "YOUTUBE_CLIENT_SECRET is required")
    .optional(),
  YOUTUBE_REFRESH_TOKEN: z
    .string()
    .min(1, "YOUTUBE_REFRESH_TOKEN is required")
    .optional(),
  YOUTUBE_CHANNEL_ID: z.string().optional(),
  YOUTUBE_DEFAULT_CATEGORY_ID: z.string().default("24"),
  YOUTUBE_DEFAULT_PRIVACY_STATUS: z
    .enum(["public", "private", "unlisted"])
    .default("public"),
  YOUTUBE_DEFAULT_TAGS: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  ...process.env,
  YOUTUBE_DEFAULT_CATEGORY_ID: process.env.YOUTUBE_DEFAULT_CATEGORY_ID ?? "24",
  YOUTUBE_DEFAULT_PRIVACY_STATUS:
    process.env.YOUTUBE_DEFAULT_PRIVACY_STATUS ?? "public",
  REPLICATE_MODEL:
    process.env.REPLICATE_MODEL ?? "black-forest-labs/flux-video",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
});

export function assertEnv(keys: (keyof AppEnv)[]) {
  const missing = keys.filter((key) => {
    const value = env[key];
    return value === undefined || value === "";
  });
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getYoutubeTags(baseTags: string[] = []) {
  if (!env.YOUTUBE_DEFAULT_TAGS) return baseTags;
  return Array.from(
    new Set([
      ...baseTags,
      ...env.YOUTUBE_DEFAULT_TAGS.split(",").map((tag) => tag.trim()),
    ]),
  ).filter(Boolean);
}
