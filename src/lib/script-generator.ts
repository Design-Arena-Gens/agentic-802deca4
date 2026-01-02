import OpenAI from "openai";
import { env, assertEnv, getYoutubeTags } from "./env";
import { ScriptResult, TrendIdea } from "./types";

const openaiClient = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

export async function generateVideoScript(
  idea: TrendIdea,
): Promise<ScriptResult> {
  assertEnv(["OPENAI_API_KEY"]);

  if (!openaiClient) {
    throw new Error("OpenAI client is not configured.");
  }

  const completion = await openaiClient.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a growth strategist crafting high-retention, 60-second vertical video scripts for YouTube Shorts. Deliver lively narration, clear scene prompts, and viral hooks.",
      },
      {
        role: "user",
        content: [
          "Generate a punchy script for a 60-second viral short based on the following trend:",
          `Trend keyword: ${idea.keyword}`,
          idea.description ? `Related context: ${idea.description}` : "",
          "",
          "Return JSON with the following fields:",
          "- title: 70 char max.",
          "- description: 2 concise sentences with a strong CTA.",
          "- hook: a 12-word pattern interrupt opening line.",
          "- script: a numbered list of 6-8 scenes combining narration and visuals.",
          "- hashtags: array of 6 SEO-friendly hashtags.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "script",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            hook: { type: "string" },
            script: { type: "string" },
            hashtags: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 10,
            },
          },
          required: ["title", "description", "hook", "script", "hashtags"],
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI did not return content.");
  }

  const draft = JSON.parse(content) as ScriptResult;
  const hashtags = getYoutubeTags(draft.hashtags);

  return {
    ...draft,
    hashtags,
  };
}
