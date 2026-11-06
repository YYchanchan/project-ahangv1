import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export interface SessionPayload {
  sub: string;
  provider: "weixin" | "admin";
  platform?: "mp-weixin" | "app" | "h5";
  iat: number;
  exp: number;
}

function sessionSecret(): string {
  const configured = process.env.WECHAT_SESSION_SECRET || process.env.SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return "project-ahang-local-development-secret";
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", sessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  userId: string,
  provider: SessionPayload["provider"],
  platform?: SessionPayload["platform"],
): { token: string; expiresIn: number } {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60;
  const payload: SessionPayload = {
    sub: userId,
    provider,
    platform,
    iat: now,
    exp: now + expiresIn,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { token: `${encodedPayload}.${sign(encodedPayload)}`, expiresIn };
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, suppliedSignature, ...rest] = token.split(".");
  if (!encodedPayload || !suppliedSignature || rest.length) return null;
  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, salt, expectedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
