import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import type { Animal, PublicMemoryRecord, Species, TaskChallenge, User, UserRole } from "./src/types";
import { createSessionToken, verifySessionToken } from "./server/security";
import { startLogMaintenance, writeLog } from "./server/logger";
import { createStore, type Store } from "./server/store";
import type {
  ReviewInput,
  SubmissionStatus,
  SubmissionType,
  UserUpdateInput,
  WechatProfileInput,
} from "./server/store-types";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

interface WechatSessionResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  access_token?: string;
  errcode?: number;
  errmsg?: string;
}

type WechatPlatform = "mp-weixin" | "app";
type AuthedRequest = Request & { currentUser?: User };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.mimetype)) {
      callback(new Error("仅支持 JPG、PNG 或 WebP 图片"));
      return;
    }
    callback(null, true);
  },
});

function asyncRoute(
  handler: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as AuthedRequest, res, next)).catch(next);
  };
}

function bearerToken(req: Request): string {
  const authorization = req.header("Authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function optionalAuth(store: Store) {
  return asyncRoute(async (req, _res, next) => {
    const token = bearerToken(req);
    if (token) {
      const session = verifySessionToken(token);
      if (session) {
        const user = await store.getUser(session.sub);
        if (user?.status === "active") req.currentUser = user;
      }
    }
    next();
  });
}

function requireAuth(roles?: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: "请先登录后再操作" });
      return;
    }
    if (roles && !roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: "当前账号没有执行此操作的权限" });
      return;
    }
    next();
  };
}

function issueLogin(user: User, provider: "weixin" | "admin", platform?: "mp-weixin" | "app" | "h5") {
  const session = createSessionToken(user.id, provider, platform);
  return { ...session, user };
}

function cleanWechatNickname(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const nickname = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!nickname) return undefined;
  return Array.from(nickname).slice(0, 40).join("");
}

function cleanWechatAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const avatarUrl = value.trim().replace(/\\/g, "/");
  if (!avatarUrl) return undefined;
  if (!/^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(avatarUrl)) return undefined;
  if (avatarUrl.split("/").includes("..")) return undefined;
  return avatarUrl;
}

async function exchangeWechatCode(code: string, platform: WechatPlatform): Promise<WechatSessionResponse> {
  const miniProgram = platform === "mp-weixin";
  const appId = miniProgram ? process.env.WECHAT_MINI_APPID : process.env.WECHAT_APP_APPID;
  const appSecret = miniProgram ? process.env.WECHAT_MINI_SECRET : process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      miniProgram
        ? "微信小程序登录尚未配置：请设置 WECHAT_MINI_APPID 和 WECHAT_MINI_SECRET"
        : "微信 App 登录尚未配置：请设置 WECHAT_APP_APPID 和 WECHAT_APP_SECRET",
    );
  }
  const endpoint = miniProgram
    ? "https://api.weixin.qq.com/sns/jscode2session"
    : "https://api.weixin.qq.com/sns/oauth2/access_token";
  const query = new URLSearchParams({
    appid: appId,
    secret: appSecret,
    grant_type: "authorization_code",
  });
  query.set(miniProgram ? "js_code" : "code", code);
  const response = await fetch(`${endpoint}?${query.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": "project-ahang/2.0" },
  });
  if (!response.ok) throw new Error(`微信服务请求失败（${response.status}）`);
  const result = (await response.json()) as WechatSessionResponse;
  if (result.errcode || !result.openid) {
    throw new Error(result.errmsg || `微信登录凭证无效（${result.errcode || "unknown"}）`);
  }
  return result;
}

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") throw new Error("GEMINI_API_KEY 未配置");
  aiClient ||= new GoogleGenAI({ apiKey });
  return aiClient;
}

export function buildApp(store: Store) {
  const app = express();
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.once("finish", () => {
      const elapsedNanoseconds = process.hrtime.bigint() - startedAt;
      const status = res.statusCode;
      void writeLog(status >= 500 ? "error" : status >= 400 ? "warn" : "info", "http_request", {
        method: req.method,
        path: req.originalUrl.split("?", 1)[0],
        status,
        durationMs: Number(elapsedNanoseconds / 1_000_000n),
        userId: (req as AuthedRequest).currentUser?.id || null,
      });
    });
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(UPLOAD_ROOT, {
    fallthrough: false,
    immutable: true,
    maxAge: "1y",
  }));
  app.use((req, res, next) => {
    const allowedOrigin = process.env.CORS_ORIGIN;
    if (allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(optionalAuth(store));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", database: "mysql" });
  });

  app.post("/api/auth/wechat", asyncRoute(async (req, res) => {
    const { code, platform = "mp-weixin", nickname, avatarUrl } = req.body as {
      code?: string;
      platform?: WechatPlatform;
      nickname?: string;
      avatarUrl?: string;
    };
    if (!code?.trim()) return res.status(400).json({ error: "微信登录 code 不能为空" });
    if (platform !== "mp-weixin" && platform !== "app") {
      return res.status(400).json({ error: "不支持的微信登录平台" });
    }
    const wechat = await exchangeWechatCode(code, platform);
    const user = await store.upsertWechatUser({
      openid: wechat.openid!,
      unionid: wechat.unionid,
      nickname: cleanWechatNickname(nickname),
      avatarUrl: cleanWechatAvatarUrl(avatarUrl),
    });
    return res.json(issueLogin(user, "weixin", platform));
  }));

  app.post("/api/auth/admin", asyncRoute(async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: "请输入管理员账号和密码" });
    }
    const user = await store.authenticateAdmin(username.trim(), password);
    if (!user) return res.status(401).json({ error: "管理员账号或密码错误" });
    return res.json(issueLogin(user, "admin", "h5"));
  }));

  app.get("/api/auth/me", requireAuth(), (req: AuthedRequest, res) => {
    res.json({ user: req.currentUser });
  });

  app.put("/api/auth/profile", requireAuth(), asyncRoute(async (req, res) => {
    const profile: WechatProfileInput = {
      nickname: cleanWechatNickname(req.body?.nickname),
      avatarUrl: cleanWechatAvatarUrl(req.body?.avatarUrl),
    };
    if (req.body?.nickname !== undefined && !profile.nickname) {
      return res.status(400).json({ error: "请输入有效的微信昵称" });
    }
    if (req.body?.avatarUrl !== undefined && !profile.avatarUrl) {
      return res.status(400).json({ error: "头像必须先上传到后端 uploads 目录" });
    }
    if (!profile.nickname && !profile.avatarUrl) {
      return res.status(400).json({ error: "微信昵称或头像不能为空" });
    }
    const user = await store.updateWechatProfile(req.currentUser!.id, profile);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json({ user });
  }));

  app.get("/api/animals", asyncRoute(async (req, res) => {
    const items = await store.listAnimals({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      userId: req.currentUser?.id,
    });
    res.json({ items });
  }));

  app.get("/api/animals/:id", asyncRoute(async (req, res) => {
    const animal = await store.getAnimal(req.params.id, req.currentUser?.id);
    if (!animal) return res.status(404).json({ error: "动物档案不存在" });
    res.json({ animal });
  }));

  app.get("/api/species", asyncRoute(async (req, res) => {
    const items = await store.listSpecies(typeof req.query.search === "string" ? req.query.search : "");
    res.json({ items });
  }));

  app.get("/api/species/:id", asyncRoute(async (req, res) => {
    const species = await store.getSpecies(req.params.id);
    if (!species) return res.status(404).json({ error: "物种知识不存在" });
    res.json({ species });
  }));

  app.get("/api/memories", asyncRoute(async (req, res) => {
    const animalId = typeof req.query.animalId === "string" ? req.query.animalId : undefined;
    res.json({ items: await store.listMemories(animalId, req.currentUser?.id) });
  }));

  app.put("/api/memories/:id/like", requireAuth(), asyncRoute(async (req, res) => {
    res.json(await store.setMemoryLike(req.currentUser!.id, req.params.id, req.body?.liked !== false));
  }));

  app.get("/api/memorial-comments", asyncRoute(async (req, res) => {
    const animalId = typeof req.query.animalId === "string" ? req.query.animalId : undefined;
    res.json({ items: await store.listMemorialComments(animalId, req.currentUser?.id) });
  }));

  app.post("/api/memorial-comments", requireAuth(), asyncRoute(async (req, res) => {
    const animalId = typeof req.body?.animalId === "string" ? req.body.animalId : "";
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!animalId || !content) return res.status(400).json({ error: "动物和寄语内容不能为空" });
    res.status(201).json({ comment: await store.createMemorialComment(req.currentUser!, animalId, content) });
  }));

  app.put("/api/memorial-comments/:id/flower", requireAuth(), asyncRoute(async (req, res) => {
    res.json(await store.setCommentFlower(req.currentUser!.id, req.params.id, req.body?.flowered !== false));
  }));

  app.get("/api/tasks", asyncRoute(async (_req, res) => {
    res.json({ items: await store.listTasks() });
  }));

  app.get("/api/favorites", requireAuth(), asyncRoute(async (req, res) => {
    res.json({ items: await store.listFavorites(req.currentUser!.id) });
  }));

  app.put("/api/favorites/:animalId", requireAuth(), asyncRoute(async (req, res) => {
    const favorite = req.body?.favorite !== false;
    res.json({ favorite: await store.setFavorite(req.currentUser!.id, req.params.animalId, favorite) });
  }));

  app.post("/api/animals/:animalId/candles", requireAuth(), asyncRoute(async (req, res) => {
    res.json(await store.lightCandle(req.currentUser!.id, req.params.animalId));
  }));

  app.get("/api/candles", asyncRoute(async (req, res) => {
    res.json({ items: await store.listCandleStats(req.currentUser?.id) });
  }));

  app.put("/api/animals/:animalId/observations/:observationId/like", requireAuth(), asyncRoute(async (req, res) => {
    res.json(await store.setObservationLike(
      req.currentUser!.id,
      req.params.animalId,
      req.params.observationId,
      req.body?.liked !== false,
    ));
  }));

  app.get("/api/profile/stats", requireAuth(), asyncRoute(async (req, res) => {
    res.json({ stats: await store.getProfileStats(req.currentUser!.id) });
  }));

  app.post("/api/uploads", requireAuth(), upload.single("file"), asyncRoute(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "请选择需要上传的图片" });
    const relativePath = path.posix.join("media", `${randomUUID()}${imageExtensions[req.file.mimetype]}`);
    const diskPath = path.join(UPLOAD_ROOT, ...relativePath.split("/"));
    const publicUrl = `/uploads/${relativePath}`;
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, req.file.buffer, { flag: "wx" });
    try {
      const id = await store.saveMedia(req.currentUser!.id, {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: relativePath,
        publicUrl,
      });
      res.status(201).json({ id, url: publicUrl });
    } catch (error) {
      await unlink(diskPath).catch(() => undefined);
      throw error;
    }
  }));

  app.get("/api/media/:id", asyncRoute(async (req, res) => {
    const media = await store.getMedia(req.params.id);
    if (!media) return res.status(404).json({ error: "图片不存在" });
    if (media.publicUrl) return res.redirect(302, media.publicUrl);
    if (!media.data) return res.status(404).json({ error: "Image file is missing" });
    res.setHeader("Content-Type", media.mimeType);
    res.setHeader("Content-Length", String(media.size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(media.data);
  }));

  app.post("/api/submissions", requireAuth(["contributor", "reviewer", "admin"]), asyncRoute(async (req, res) => {
    const body = req.body as {
      type?: SubmissionType;
      animalId?: string;
      animalName?: string;
      title?: string;
      details?: string;
      payload?: Record<string, unknown>;
      mediaUrl?: string;
      source?: string;
      copyright?: string;
    };
    const allowed: SubmissionType[] = ["recommend", "observation", "memory", "correction", "archive", "task"];
    if (!body.type || !allowed.includes(body.type)) return res.status(400).json({ error: "投稿类型无效" });
    if (!body.title?.trim() || !body.details?.trim()) {
      return res.status(400).json({ error: "投稿标题和内容不能为空" });
    }
    const submission = await store.createSubmission(req.currentUser!, {
      type: body.type,
      animalId: body.animalId,
      animalName: body.animalName,
      title: body.title.trim(),
      details: body.details.trim(),
      payload: body.payload || {},
      mediaUrl: body.mediaUrl,
      source: body.source,
      copyright: body.copyright,
    });
    res.status(201).json({ submission });
  }));

  app.get("/api/submissions/mine", requireAuth(), asyncRoute(async (req, res) => {
    res.json({ items: await store.listUserSubmissions(req.currentUser!.id) });
  }));

  const adminOnly = requireAuth(["reviewer", "admin"]);
  app.get("/api/admin/stats", adminOnly, asyncRoute(async (_req, res) => {
    res.json({ stats: await store.getAdminStats() });
  }));
  app.get("/api/admin/submissions", adminOnly, asyncRoute(async (req, res) => {
    res.json({
      items: await store.listAdminSubmissions({
        status: typeof req.query.status === "string" ? req.query.status as SubmissionStatus : undefined,
        type: typeof req.query.type === "string" ? req.query.type as SubmissionType : undefined,
      }),
    });
  }));
  app.put("/api/admin/submissions/:id/review", adminOnly, asyncRoute(async (req, res) => {
    const input = req.body as ReviewInput;
    if (!input.status || !["approved", "need_supplement", "rejected"].includes(input.status)) {
      return res.status(400).json({ error: "审核状态无效" });
    }
    const submission = await store.reviewSubmission(req.params.id, req.currentUser!, {
      status: input.status,
      comment: typeof input.comment === "string" ? input.comment.trim() : "",
    });
    if (!submission) return res.status(404).json({ error: "投稿不存在" });
    res.json({ submission });
  }));
  app.get("/api/admin/animals", adminOnly, asyncRoute(async (req, res) => {
    res.json({ items: await store.listAnimals({ search: typeof req.query.search === "string" ? req.query.search : undefined }) });
  }));
  app.put("/api/admin/animals/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    const animal = req.body?.animal as Animal | undefined;
    if (!animal || animal.id !== req.params.id || !animal.name) {
      return res.status(400).json({ error: "动物档案数据不完整" });
    }
    res.json({ animal: await store.saveAnimal(animal, req.currentUser!.id) });
  }));
  app.delete("/api/admin/animals/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    res.json({ deleted: await store.deleteAnimal(req.params.id, req.currentUser!.id) });
  }));
  app.get("/api/admin/species", adminOnly, asyncRoute(async (req, res) => {
    res.json({ items: await store.listSpecies(typeof req.query.search === "string" ? req.query.search : "") });
  }));
  app.put("/api/admin/species/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    const species = req.body?.species as Species | undefined;
    if (!species || species.id !== req.params.id || !species.biologicalProfile?.chineseName) {
      return res.status(400).json({ error: "物种知识数据不完整" });
    }
    res.json({ species: await store.saveSpecies(species, req.currentUser!.id) });
  }));
  app.delete("/api/admin/species/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    res.json({ deleted: await store.deleteSpecies(req.params.id, req.currentUser!.id) });
  }));
  app.get("/api/admin/memories", adminOnly, asyncRoute(async (req, res) => {
    res.json({ items: await store.listMemories(undefined, req.currentUser!.id) });
  }));
  app.put("/api/admin/memories/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    const memory = req.body?.memory as PublicMemoryRecord | undefined;
    if (!memory || memory.id !== req.params.id || !memory.title) return res.status(400).json({ error: "回忆数据不完整" });
    res.json({ memory: await store.saveMemory(memory, req.currentUser!.id) });
  }));
  app.delete("/api/admin/memories/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    res.json({ deleted: await store.deleteMemory(req.params.id, req.currentUser!.id) });
  }));
  app.get("/api/admin/tasks", adminOnly, asyncRoute(async (_req, res) => {
    res.json({ items: await store.listTasks() });
  }));
  app.put("/api/admin/tasks/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    const task = req.body?.task as TaskChallenge | undefined;
    if (!task || task.id !== req.params.id || !task.title) return res.status(400).json({ error: "协作任务数据不完整" });
    res.json({ task: await store.saveTask(task, req.currentUser!.id) });
  }));
  app.delete("/api/admin/tasks/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    res.json({ deleted: await store.deleteTask(req.params.id, req.currentUser!.id) });
  }));
  app.get("/api/admin/users", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    res.json({ items: await store.listUsers(typeof req.query.search === "string" ? req.query.search : "") });
  }));
  app.put("/api/admin/users/:id", requireAuth(["admin"]), asyncRoute(async (req, res) => {
    const user = await store.updateUser(req.params.id, req.body as UserUpdateInput, req.currentUser!.id);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json({ user });
  }));
  app.get("/api/admin/logs", adminOnly, asyncRoute(async (_req, res) => {
    res.json({ items: await store.listReviewLogs() });
  }));

  app.post("/api/chat", asyncRoute(async (req, res) => {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Message is required" });
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: "你是阿杭之友，一名严谨、温柔的动物学科普与个体档案助手。",
      },
    });
    res.json({ text: response.text });
  }));

  const h5DistPath = path.join(process.cwd(), "dist", "build", "h5");
  const adminDistPath = path.join(process.cwd(), "dist", "admin");
  if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "true") {
    app.use("/admin", express.static(adminDistPath));
    app.get(["/admin", "/admin/*"], (_req, res) => res.sendFile(path.join(adminDistPath, "index.html")));
    app.use(express.static(h5DistPath));
    app.get("*", (_req, res) => res.sendFile(path.join(h5DistPath, "index.html")));
  }

  app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    void writeLog("error", "request_error", {
      method: req.method,
      path: req.originalUrl.split("?", 1)[0],
      userId: (req as AuthedRequest).currentUser?.id || null,
      message: error.message || "服务器处理失败",
      stack: error.stack,
    });
    const configuration = /not configured|required|ECONNREFUSED|Unknown database/i.test(error.message);
    res.status(configuration ? 503 : 500).json({ error: error.message || "服务器处理失败" });
  });
  return app;
}

export async function startServer() {
  const stopLogMaintenance = await startLogMaintenance();
  await writeLog("info", "server_starting", { host: HOST, port: PORT, nodeEnv: process.env.NODE_ENV || "development" });
  const store = createStore();
  try {
    await store.initialize();
  } catch (error) {
    stopLogMaintenance();
    await writeLog("error", "server_start_failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
  const app = buildApp(store);
  const server = app.listen(PORT, HOST, () => {
    console.log(`Project Ahang server listening on http://${HOST}:${PORT}`);
    void writeLog("info", "server_started", { host: HOST, port: PORT });
  });
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    void writeLog("info", "server_stopping", { signal }).finally(() => {
      server.close(() => {
        stopLogMaintenance();
        void store.close();
      });
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  return { app, server, store };
}

if (process.env.NODE_ENV !== "test") {
  startServer().catch(async (error) => {
    console.error("Project Ahang server failed to start:", error);
    await writeLog("error", "server_unhandled_start_error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exitCode = 1;
  });
}
