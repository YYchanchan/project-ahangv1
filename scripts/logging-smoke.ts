import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  cleanupPreviousWeekLogs,
  currentWeekStartKey,
  dailyLogKey,
  writeLog,
} from "../server/logger";

async function main() {
  const testPrefix = path.join(tmpdir(), "project-ahang-log-test-");
  const root = await mkdtemp(testPrefix);
  process.env.LOG_DIR = root;
  process.env.LOG_TIMEZONE = "Asia/Shanghai";
  process.env.NODE_ENV = "test";

  try {
    await Promise.all([
      writeFile(path.join(root, "app-2026-08-16.log"), "older week\n", "utf8"),
      writeFile(path.join(root, "app-2026-08-23.log"), "previous week\n", "utf8"),
      writeFile(path.join(root, "app-2026-08-24.log"), "current week\n", "utf8"),
      writeFile(path.join(root, "notes.txt"), "must stay\n", "utf8"),
    ]);

    const referenceDate = new Date("2026-08-28T12:00:00+08:00");
    if (currentWeekStartKey(referenceDate) !== "2026-08-24") {
      throw new Error("Asia/Shanghai weekly boundary is incorrect");
    }
    const deletedFiles = await cleanupPreviousWeekLogs(referenceDate);
    const remainingAfterCleanup = (await readdir(root)).sort();
    if (deletedFiles !== 2) throw new Error(`Expected two deleted log files, received ${deletedFiles}`);
    if (remainingAfterCleanup.join(",") !== "app-2026-08-24.log,notes.txt") {
      throw new Error(`Unexpected cleanup result: ${remainingAfterCleanup.join(",")}`);
    }

    const { buildApp } = await import("../server");
    const server = buildApp({} as never).listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Logging test server did not expose a port");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/health?token=must-not-be-logged`);
      if (!response.ok) throw new Error(`Logging test endpoint returned HTTP ${response.status}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    await writeLog("info", "logging_smoke", { safe: true });
    const todayFile = `app-${dailyLogKey()}.log`;
    const todayContents = await readFile(path.join(root, todayFile), "utf8");
    const entries = todayContents.trim().split("\n").map((line) => JSON.parse(line) as {
      event?: string;
      safe?: boolean;
      method?: string;
      path?: string;
      status?: number;
    });
    const entry = entries.at(-1) || {};
    if (entry.event !== "logging_smoke" || entry.safe !== true) {
      throw new Error("Daily JSON-line log entry was not written correctly");
    }
    const requestEntry = entries.find((item) => item.event === "http_request");
    if (requestEntry?.method !== "GET" || requestEntry.path !== "/api/health" || requestEntry.status !== 200) {
      throw new Error("HTTP access log entry was not written correctly");
    }
    if (todayContents.includes("must-not-be-logged")) {
      throw new Error("HTTP query value leaked into the application log");
    }

    console.log(JSON.stringify({
      dailyFile: todayFile,
      jsonLine: "ok",
      httpAccessLog: "ok",
      queryValuesExcluded: true,
      weekStartsOnMonday: true,
      deletedPreviousWeekFiles: deletedFiles,
      keptCurrentWeekLog: true,
      keptUnrelatedFile: true,
    }, null, 2));
  } finally {
    const resolvedRoot = path.resolve(root);
    const allowedPrefix = `${path.resolve(tmpdir())}${path.sep}project-ahang-log-test-`;
    if (!resolvedRoot.startsWith(allowedPrefix)) {
      throw new Error(`Refusing to remove unexpected test directory: ${resolvedRoot}`);
    }
    await rm(resolvedRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
