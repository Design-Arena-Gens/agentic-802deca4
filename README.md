## Viral YouTube Agent

Autonomous pipeline that detects trending topics, scripts a 60-second short, generates motion graphics with Replicate, and pushes the finished video to YouTube automatically. Ships as a Vercel-ready Next.js App Router project with a cron endpoint for daily uploads.

---

## Features

- Google Trends ingestion with region selection
- OpenAI-assisted hook + script generation tuned for retention
- Replicate text-to-video synthesis (Flux Video default)
- YouTube Data API upload with OAuth2 refresh token flow
- Dashboard to monitor env configuration, trigger manual runs, and inspect logs
- `/api/cron/daily-upload` endpoint wired to `vercel.json` cron schedule

---

## Prerequisites

| Service | Purpose | Notes |
| --- | --- | --- |
| **OpenAI** | Scriptwriting | Set `OPENAI_API_KEY` + optional `OPENAI_MODEL` |
| **Replicate** | Video generation | `REPLICATE_API_TOKEN` with model access |
| **Google Cloud** | YouTube upload | OAuth client with `https://www.googleapis.com/auth/youtube.upload` |

Run `cp .env.example .env.local` and populate:

```
OPENAI_API_KEY=...
REPLICATE_API_TOKEN=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
```

Generate a refresh token by authorizing the OAuth client with the YouTube upload scope (Google OAuth Playground works well).

---

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 for the dashboard. Manual runs can be triggered from the UI; check the run cards for logs and generated asset links.

---

## Cron Automation

Copy `vercel-cron.example.json` to `vercel.json` to register a Vercel Cron job:

```bash
cp vercel-cron.example.json vercel.json
```

Adjust the schedule or path as needed before deploying. You can test locally via:

```bash
curl http://localhost:3000/api/cron/daily-upload
```

Pass `?dryRun=true` to skip the YouTube upload stage while validating the flow.

---

## Deployment

The project is optimized for Vercel:

```bash
npm run build
npm start
```

Set the environment variables in the Vercel dashboard and deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-802deca4
```

After deployment, confirm the cron route via:

```bash
curl https://agentic-802deca4.vercel.app/api/cron/daily-upload?dryRun=true
```
