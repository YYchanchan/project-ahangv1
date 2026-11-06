import { appendFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";

export type LogLevel = "info" | "warn" | "error";

let preparedRoot = "";
let writeQueue: Promise<void> = Promise.resolve();
let maintenanceTimer: ReturnType<typeof setInterval> | null = null;
let lastMaintenanceWeek = "";

function logRoot(): string {
  return path.resolve(process.env.LOG_DIR || path.join(process.cwd(), "logs"));
}

function logTimeZone(): string {
  const configured = process.env.LOG_TIMEZONE || process.env.TZ || "Asia/Shanghai";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: configured }).format(new Date());
    return configured;
  } catch {
    return "Asia/Shanghai";
  }
}

function dateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: logTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function dailyLogKey(date = new Date()): string {
  const { year, month, day } = dateParts(date);
  return formatDateKey(year, month, day);
}

export function currentWeekStartKey(date = new Date()): string {
  const { year, month, day } = dateParts(date);
  const localCalendarDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (localCalendarDate.getUTCDay() + 6) % 7;
  localCalendarDate.setUTCDate(localCalendarDate.getUTCDate() - daysSinceMonday);
  return formatDateKey(
    localCalendarDate.getUTCFullYear(),
    localCalendarDate.getUTCMonth() + 1,
    localCalendarDate.getUTCDate(),
  );
}

async function ensureLogRoot(): Promise<string> {
  const root = logRoot();
  if (preparedRoot !== root) {
    await mkdir(root, { recursive: true });
    preparedRoot = root;
  }
  return root;
}

export function writeLog(level: LogLevel, event: string, details: Record<string, unknown> = {}): Promise<void> {
  const now = new Date();
  const entry = {
    timestamp: now.toISOString(),
    localDate: dailyLogKey(now),
    timeZone: logTimeZone(),
    level,
    event,
    ...details,
  };
  const write = async () => {
    try {
      const root = await ensureLogRoot();
      await appendFile(path.join(root, `app-${entry.localDate}.log`), `${JSON.stringify(entry)}\n`, "utf8");
    } catch (error) {
      console.error("Failed to write application log:", error);
    }
  };
  writeQueue = writeQueue.then(write, write);
  return writeQueue;
}

export async function cleanupPreviousWeekLogs(now = new Date()): Promise<number> {
  const root = await ensureLogRoot();
  const currentWeek = currentWeekStartKey(now);
  const entries = await readdir(root, { withFileTypes: true });
  let deleted = 0;
  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile()) return;
    const match = /^app-(\d{4}-\d{2}-\d{2})\.log$/.exec(entry.name);
    if (!match || match[1] >= currentWeek) return;
    await unlink(path.join(root, entry.name));
    deleted += 1;
  }));
  return deleted;
}

async function runWeeklyMaintenance(now = new Date()): Promise<void> {
  const week = currentWeekStartKey(now);
  if (lastMaintenanceWeek === week) return;
  try {
    const deletedFiles = await cleanupPreviousWeekLogs(now);
    lastMaintenanceWeek = week;
    await writeLog("info", "log_cleanup", { currentWeek: week, deletedFiles });
  } catch (error) {
    await writeLog("error", "log_cleanup_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function startLogMaintenance(): Promise<() => void> {
  await runWeeklyMaintenance();
  if (!maintenanceTimer) {
    maintenanceTimer = setInterval(() => {
      void runWeeklyMaintenance();
    }, 60 * 60 * 1000);
    maintenanceTimer.unref();
  }
  return () => {
    if (maintenanceTimer) clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  };
}
