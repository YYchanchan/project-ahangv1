import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { MysqlStore } from "../server/mysql-store";

dotenv.config({ path: existsSync(".env") ? ".env" : ".env.development" });

async function main() {
  const sqlPath = path.resolve("database", "project_ahang.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }
  const store = new MysqlStore();
  try {
    await store.initialize();
  } finally {
    await store.close();
  }
  console.log(`Imported ${sqlPath} into MySQL and applied schema upgrades.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
