import { existsSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: existsSync(".env") ? ".env" : ".env.development" });
process.env.NODE_ENV = "test";

async function main() {
  const [{ buildApp }, { createStore }] = await Promise.all([
    import("../server"),
    import("../server/store"),
  ]);
  const store = createStore();
  await store.initialize();
  const server = buildApp(store).listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  let uploadedMediaId = "";
  let uploadedFilePath = "";
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Smoke server did not expose a TCP port");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const paths = ["health", "animals", "species", "memories", "tasks", "memorial-comments", "candles"];
    const results: Record<string, unknown> = {};
    for (const name of paths) {
      const response = await fetch(`${baseUrl}/api/${name}`);
      if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);
      const body = await response.json() as { status?: string; database?: string; items?: unknown[] };
      results[name] = name === "health"
        ? { status: body.status, database: body.database }
        : { count: body.items?.length || 0 };
    }
    const existingImages = [
      "/uploads/animals/ahang-cover.jpg",
      "/uploads/animals/ahang-bebei.jpg",
      "/uploads/animals/bebei-cover.jpg",
      "/uploads/animals/paopao-cover.jpg",
      "/uploads/animals/paopao-baby.jpg",
      "/uploads/animals/paopao-birthday.jpg",
      "/uploads/animals/sunshangxiang-cover.jpg",
      "/uploads/animals/sunsimiao-cover.jpg",
      "/uploads/memories/ahang-logo.jpg",
    ];
    for (const imagePath of existingImages) {
      const response = await fetch(`${baseUrl}${imagePath}`);
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        throw new Error(`${imagePath} returned HTTP ${response.status}`);
      }
    }
    results.existingImages = { count: existingImages.length, browserAccess: "ok" };
    const loginResponse = await fetch(`${baseUrl}/api/auth/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    if (!loginResponse.ok) throw new Error(`admin login returned HTTP ${loginResponse.status}`);
    const login = await loginResponse.json() as { token: string };
    const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${login.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: process.env.ADMIN_DISPLAY_NAME || "阿杭管理员" }),
    });
    if (!profileResponse.ok) throw new Error(`profile update returned HTTP ${profileResponse.status}`);
    const profile = await profileResponse.json() as { user?: { nickname?: string; avatarUrl?: string } };
    if (!profile.user?.nickname || typeof profile.user.avatarUrl !== "string") {
      throw new Error("profile update did not return the MySQL user profile");
    }
    results.profile = { update: "ok", mysql: "users.nickname + users.avatar_url" };
    const adminCounts: Record<string, number> = {};
    for (const name of ["animals", "species", "memories", "tasks"]) {
      const response = await fetch(`${baseUrl}/api/admin/${name}`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      if (!response.ok) throw new Error(`admin/${name} returned HTTP ${response.status}`);
      const body = await response.json() as { items?: unknown[] };
      adminCounts[name] = body.items?.length || 0;
    }
    results.admin = { login: "ok", counts: adminCounts };

    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
    const samplePath = path.join(uploadRoot, "animals", "ahang-cover.jpg");
    const form = new FormData();
    form.append("file", new Blob([await readFile(samplePath)], { type: "image/jpeg" }), "smoke-upload.jpg");
    const uploadResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${login.token}` },
      body: form,
    });
    if (!uploadResponse.ok) throw new Error(`upload returned HTTP ${uploadResponse.status}`);
    const uploaded = await uploadResponse.json() as { id: string; url: string };
    const uploadedDiskPath = path.resolve(uploadRoot, ...uploaded.url.replace(/^\/uploads\//, "").split("/"));
    if (!uploadedDiskPath.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Upload path escaped UPLOAD_DIR");
    uploadedMediaId = uploaded.id;
    uploadedFilePath = uploadedDiskPath;
    try {
      const imageResponse = await fetch(`${baseUrl}${uploaded.url}`);
      if (!imageResponse.ok || imageResponse.headers.get("content-type") !== "image/jpeg") {
        throw new Error(`uploaded image returned HTTP ${imageResponse.status}`);
      }
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "project_ahang",
      });
      const [mediaRows] = await connection.query<mysql.RowDataPacket[]>(
        "SELECT storage_path, public_url, file_data FROM media_files WHERE id = ?",
        [uploaded.id],
      );
      if (!mediaRows[0]?.storage_path || mediaRows[0].public_url !== uploaded.url || mediaRows[0].file_data !== null) {
        await connection.end();
        throw new Error("Uploaded image metadata was not saved correctly");
      }
      await connection.execute("DELETE FROM media_files WHERE id = ?", [uploaded.id]);
      await connection.end();
      results.upload = { status: "ok", fileStorage: "uploads", metadata: "mysql" };
    } finally {
      await unlink(uploadedDiskPath).catch(() => undefined);
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    if (uploadedMediaId) {
      const cleanup = await mysql.createConnection({
        host: process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "project_ahang",
      }).catch(() => null);
      if (cleanup) {
        await cleanup.execute("DELETE FROM media_files WHERE id = ?", [uploadedMediaId]).catch(() => undefined);
        await cleanup.end();
      }
    }
    if (uploadedFilePath) await unlink(uploadedFilePath).catch(() => undefined);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await store.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
