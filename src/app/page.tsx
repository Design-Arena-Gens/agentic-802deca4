import { getRuns, triggerDailyUpload } from "./actions";
import { env } from "@/lib/env";
import { AgentRun, AgentLogEntry } from "@/lib/types";
import Link from "next/link";

const ENV_REQUIREMENTS: {
  key: keyof typeof env;
  label: string;
  critical?: boolean;
  docs: string;
}[] = [
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    critical: true,
    docs: "https://platform.openai.com/api-keys",
  },
  {
    key: "REPLICATE_API_TOKEN",
    label: "Replicate API Token",
    critical: true,
    docs: "https://replicate.com/account/api-tokens",
  },
  {
    key: "YOUTUBE_CLIENT_ID",
    label: "YouTube OAuth Client ID",
    critical: true,
    docs: "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps",
  },
  {
    key: "YOUTUBE_CLIENT_SECRET",
    label: "YouTube OAuth Client Secret",
    critical: true,
    docs: "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps",
  },
  {
    key: "YOUTUBE_REFRESH_TOKEN",
    label: "YouTube Refresh Token",
    critical: true,
    docs: "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps",
  },
  {
    key: "YOUTUBE_CHANNEL_ID",
    label: "YouTube Channel ID",
    docs: "https://support.google.com/youtube/answer/3250431",
  },
];

function EnvBadge({
  label,
  ok,
  docs,
  critical,
}: {
  label: string;
  ok: boolean;
  docs: string;
  critical?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <Link
            href={docs}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-400 hover:underline"
          >
            Setup guide
          </Link>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            ok
              ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              ok ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
          {ok ? "Configured" : critical ? "Missing" : "Optional"}
        </span>
      </div>
    </div>
  );
}

function LogLine({ log }: { log: AgentLogEntry }) {
  return (
    <li
      className={`group flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-xs text-slate-300 transition hover:border-slate-700`}
    >
      <span className="font-mono text-[11px] text-slate-500">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span
        className={`mt-[2px] h-2 w-2 rounded-full ${
          log.level === "success"
            ? "bg-emerald-400"
            : log.level === "error"
              ? "bg-rose-400"
              : log.level === "warn"
                ? "bg-amber-400"
                : "bg-sky-400"
        }`}
      />
      <div className="space-y-1">
        <p className="font-medium text-slate-200">{log.message}</p>
        {log.details ? (
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-400">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        ) : null}
      </div>
    </li>
  );
}

function RunCard({ run }: { run: AgentRun }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Run ID: {run.id}
          </p>
          <h3 className="text-lg font-semibold text-slate-100">
            {run.topic?.keyword ?? "Pending topic selection"}
          </h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
          {run.completedAt
            ? `Completed ${new Date(run.completedAt).toLocaleString()}`
            : `Started ${new Date(run.startedAt).toLocaleString()}`}
        </span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Script
          </h4>
          {run.script ? (
            <div className="mt-2 space-y-2 text-sm text-slate-300">
              <p className="font-semibold text-slate-100">{run.script.title}</p>
              <p>{run.script.description}</p>
              <p className="text-xs text-slate-500">
                Hashtags: {run.script.hashtags.join(", ")}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Waiting for script.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Video
          </h4>
          {run.video ? (
            <div className="mt-2 space-y-3 text-sm text-slate-300">
              <p>Generated via {run.video.provider}</p>
              <Link
                href={run.video.videoUrl}
                className="inline-flex items-center text-xs font-medium text-sky-400 hover:underline"
                target="_blank"
              >
                Preview video
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Video not ready yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Upload
          </h4>
          {run.upload ? (
            <div className="mt-2 space-y-2 text-sm text-slate-300">
              <p>Status: {run.upload.status}</p>
              {run.upload.youtubeUrl ? (
                <Link
                  href={run.upload.youtubeUrl}
                  target="_blank"
                  className="inline-flex text-xs font-medium text-emerald-300 hover:underline"
                >
                  View on YouTube
                </Link>
              ) : null}
              {run.upload.message ? (
                <p className="text-xs text-slate-500">{run.upload.message}</p>
              ) : null}
            </div>
          ) : run.error ? (
            <p className="mt-2 text-sm text-rose-400">{run.error}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Upload pending.</p>
          )}
        </div>
      </div>
      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Execution log
        </h4>
        <ul className="mt-3 space-y-2">
          {run.logs.map((log) => (
            <LogLine key={log.timestamp} log={log} />
          ))}
        </ul>
      </div>
    </article>
  );
}

export default async function Home() {
  const runs = await getRuns();
  const envStatus = ENV_REQUIREMENTS.map((item) => ({
    ...item,
    ok: Boolean(env[item.key]),
  }));

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <section className="grid gap-10 rounded-3xl border border-slate-900 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950/90 p-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-sky-400">
              Autonomous Growth Agent
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-50 md:text-5xl">
              Launch YouTube Shorts that ride the trend cycle every single day.
            </h1>
            <p className="text-base text-slate-400 md:text-lg">
              This agent researches daily Google Trends, drafts a retention-optimized
              script with OpenAI, generates animated visuals, and uploads straight to
              your YouTube channel. Configure your API keys and hit run—or let the
              Vercel Cron fire automatically.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-300">
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1">
                Trend scouting
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1">
                Scriptwriting
              </span>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1">
                AI video
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1">
                YouTube upload
              </span>
            </div>
          </div>
          <form
            action={triggerDailyUpload}
            className="flex flex-col gap-4 rounded-2xl border border-slate-900 bg-slate-950/80 p-6"
          >
            <h2 className="text-lg font-semibold text-slate-100">
              Manual launch
            </h2>
            <p className="text-sm text-slate-400">
              Trigger a full pipeline run instantly. Leave the keyword blank to
              auto-select today&apos;s strongest trend.
            </p>
            <label className="space-y-2 text-xs text-slate-300">
              Override keyword
              <input
                type="text"
                name="keyword"
                placeholder="e.g. Solar eclipse footage"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              Region
              <select
                name="region"
                defaultValue="US"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                name="dryRun"
                className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              Dry run (skip YouTube upload)
            </label>
            <button
              type="submit"
              className="mt-2 flex items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Launch pipeline
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">
              Integrations
            </h2>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-400">
              {envStatus.filter((item) => item.ok).length}/
              {envStatus.length} ready
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {envStatus.map((item) => (
              <EnvBadge
                key={item.key}
                label={item.label}
                ok={item.ok}
                docs={item.docs}
                critical={item.critical}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-100">Run log</h2>
            <p className="text-sm text-slate-500">
              Agent maintains an in-memory log per deployment instance. Persist to
              a database for historical analytics.
            </p>
          </div>
          {runs.length ? (
            <div className="space-y-6">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
              No executions yet. Launch the pipeline above or wait for the scheduled
              cron trigger to run daily uploads.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
