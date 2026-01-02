import { nanoid } from "nanoid";
import { AgentLogEntry, AgentRun, LogLevel } from "./types";

const runs = new Map<string, AgentRun>();

export function createRun(): AgentRun {
  const id = nanoid();
  const startedAt = new Date().toISOString();
  const run: AgentRun = {
    id,
    startedAt,
    logs: [
      {
        timestamp: startedAt,
        level: "info",
        message: "Daily upload pipeline started.",
      },
    ],
  };
  runs.set(id, run);
  return run;
}

export function updateRun(
  id: string,
  updater: (current: AgentRun) => AgentRun,
): AgentRun | undefined {
  const current = runs.get(id);
  if (!current) return undefined;
  const next = updater(current);
  runs.set(id, next);
  return next;
}

export function appendLog(
  id: string,
  level: LogLevel,
  message: string,
  details?: Record<string, unknown>,
) {
  updateRun(id, (run) => ({
    ...run,
    logs: [
      ...run.logs,
      {
        timestamp: new Date().toISOString(),
        level,
        message,
        details,
      } satisfies AgentLogEntry,
    ],
  }));
}

export function completeRun(
  id: string,
  payload: Partial<Omit<AgentRun, "id" | "startedAt" | "logs">>,
) {
  updateRun(id, (run) => ({
    ...run,
    ...payload,
    completedAt: new Date().toISOString(),
  }));
}

export function listRuns(): AgentRun[] {
  return Array.from(runs.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export function getRun(id: string) {
  return runs.get(id);
}
