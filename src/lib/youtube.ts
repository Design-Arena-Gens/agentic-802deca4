import { google } from "googleapis";
import { Readable } from "stream";
import { env, assertEnv, getYoutubeTags } from "./env";
import { ScriptResult, UploadResult, VideoGenerationResult } from "./types";

function createOauthClient() {
  assertEnv(["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]);

  const oauth2Client = new google.auth.OAuth2(
    env.YOUTUBE_CLIENT_ID,
    env.YOUTUBE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );
  oauth2Client.setCredentials({
    refresh_token: env.YOUTUBE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

async function downloadVideoToBuffer(videoUrl: string) {
  const res = await fetch(videoUrl);
  if (!res.ok) {
    throw new Error(`Unable to download generated video (status: ${res.status}).`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime =
    res.headers.get("content-type") ?? "video/mp4";
  return { buffer, mimeType: mime };
}

export async function uploadVideoToYoutube(
  script: ScriptResult,
  video: VideoGenerationResult,
): Promise<UploadResult> {
  const oauth2Client = createOauthClient();
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const { buffer, mimeType } = await downloadVideoToBuffer(video.videoUrl);
  const tags = getYoutubeTags(script.hashtags);

  try {
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: script.title,
          description: `${script.hook}\n\n${script.description}\n\nScript:\n${script.script}`,
          tags,
          categoryId: env.YOUTUBE_DEFAULT_CATEGORY_ID,
        },
        status: {
          privacyStatus: env.YOUTUBE_DEFAULT_PRIVACY_STATUS,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error("YouTube upload succeeded without returning a video ID.");
    }

    return {
      status: "success",
      videoId,
      youtubeUrl: `https://youtube.com/watch?v=${videoId}`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error uploading to YouTube.";
    return {
      status: "failed",
      message,
    };
  }
}
