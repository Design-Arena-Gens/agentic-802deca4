export type TrendIdea = {
  keyword: string;
  score: number;
  description?: string;
  region?: string;
};

export type ScriptResult = {
  title: string;
  description: string;
  script: string;
  hashtags: string[];
  hook: string;
};

export type VideoGenerationResult = {
  videoUrl: string;
  previewImage?: string;
  provider: string;
  raw?: unknown;
};

export type UploadResult = {
  status: "success" | "skipped" | "failed";
  message?: string;
  videoId?: string;
  youtubeUrl?: string;
};

export type LogLevel = "info" | "warn" | "error" | "success";

export type AgentLogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, unknown>;
};

export type AgentRun = {
  id: string;
  startedAt: string;
  completedAt?: string;
  topic?: TrendIdea;
  script?: ScriptResult;
  video?: VideoGenerationResult;
  upload?: UploadResult;
  error?: string;
  logs: AgentLogEntry[];
};
