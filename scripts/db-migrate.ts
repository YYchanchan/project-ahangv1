import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { MysqlStore } from "../server/mysql-store";

dotenv.config({ path: existsSync(".env") ? ".env" : ".env.development" });

async function main() {
  const store = new MysqlStore();
  try {
    await store.initialize();
    console.log("Project Ahang MySQL schema is ready.");
  } finally {
    await store.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
