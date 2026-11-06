import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql, { type RowDataPacket } from "mysql2/promise";

dotenv.config({ path: fs.existsSync(".env") ? ".env" : ".env.development" });

const replacements: Array<[string, string]> = [
  ["/static/animals/ahang/cover.jpg", "/uploads/animals/ahang-cover.jpg"],
  ["/static/animals/ahang/ahang-bebei.jpg", "/uploads/animals/ahang-bebei.jpg"],
  ["/static/animals/beibei/cover.jpg", "/uploads/animals/bebei-cover.jpg"],
  ["/static/animals/didi/cover.jpg", "/uploads/animals/paopao-cover.jpg"],
  ["/static/animals/didi/baby.jpg", "/uploads/animals/paopao-baby.jpg"],
  ["/static/animals/didi/birthday.jpg", "/uploads/animals/paopao-birthday.jpg"],
  ["/static/animals/sunshangxiang/cover.jpg", "/uploads/animals/sunshangxiang-cover.jpg"],
  ["/static/animals/sunsimiao/cover.jpg", "/uploads/animals/sunsimiao-cover.jpg"],
  ["/static/images/ahang-logo.jpg", "/uploads/memories/ahang-logo.jpg"],
];

function migrateValue(value: string | null): string | null {
  if (!value) return value;
  return replacements.reduce((result, [from, to]) => result.split(from).join(to), value);
}

function jsonText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

async function main() {
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
  for (const [, publicUrl] of replacements) {
    const diskPath = path.join(uploadRoot, ...publicUrl.replace(/^\/uploads\//, "").split("/"));
    if (!fs.existsSync(diskPath)) throw new Error(`Missing upload asset: ${diskPath}`);
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "project_ahang",
    charset: "utf8mb4",
  });

  let animalUpdates = 0;
  let memoryUpdates = 0;
  await connection.beginTransaction();
  try {
    const [animals] = await connection.query<RowDataPacket[]>("SELECT id, image_url, data_json FROM animals FOR UPDATE");
    for (const row of animals) {
      const oldImage = row.image_url as string;
      const oldJson = jsonText(row.data_json);
      const image = migrateValue(oldImage) || "";
      const dataJson = migrateValue(oldJson) || oldJson;
      if (image !== oldImage || dataJson !== oldJson) {
        await connection.execute("UPDATE animals SET image_url = ?, data_json = ? WHERE id = ?", [image, dataJson, row.id]);
        animalUpdates += 1;
      }
    }

    const [memories] = await connection.query<RowDataPacket[]>("SELECT id, image_url FROM memories FOR UPDATE");
    for (const row of memories) {
      const oldImage = row.image_url as string | null;
      const image = migrateValue(oldImage);
      if (image !== oldImage) {
        await connection.execute("UPDATE memories SET image_url = ? WHERE id = ?", [image, row.id]);
        memoryUpdates += 1;
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  const [remaining] = await connection.query<RowDataPacket[]>(
    `SELECT id, 'animal' source FROM animals
       WHERE image_url LIKE '/static/%' OR CAST(data_json AS CHAR) LIKE '%/static/%'
     UNION ALL
     SELECT id, 'memory' source FROM memories WHERE image_url LIKE '/static/%'`,
  );
  await connection.end();
  if (remaining.length) throw new Error(`Static image paths remain in ${remaining.length} database records`);
  console.log(`Upload image migration complete: animals=${animalUpdates}, memories=${memoryUpdates}, remainingStaticPaths=0`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
