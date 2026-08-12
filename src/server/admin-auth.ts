import { getBindings } from "./bindings";

export type AdminIdentity = {
  email: string;
  userId: string;
};

export type AdminAccess =
  | { allowed: true; identity: AdminIdentity }
  | { allowed: false; reason: "signed-out" | "not-allowed" | "not-configured" };

type HeaderReader = Pick<Headers, "get">;

const defaultAdminEmails = ["elena208@abv.bg"];
const sessionCookieName = "gradina_admin_session";
const sessionLifetimeSeconds = 12 * 60 * 60;
const encoder = new TextEncoder();

function isLocalHost(host: string | null): boolean {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function configuredAdminEmails(): string[] {
  return getBindings().ADMIN_EMAILS?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) ?? defaultAdminEmails;
}

function readCookie(headers: HeaderReader, name: string): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = part.trim().split("=");
    if (cookieName === name) return valueParts.join("=");
  }
  return null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(password: string): Promise<CryptoKey> {
  const keyBytes = await crypto.subtle.digest("SHA-256", encoder.encode(`gradina-admin-session:${password}`));
  return crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function createSessionToken(email: string, password: string): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({
    email: email.toLowerCase(),
    expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
  })));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(password), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function sessionEmail(token: string, password: string): Promise<string | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(password),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      email?: string;
      expiresAt?: number;
    };
    if (!data.email || !data.expiresAt || data.expiresAt <= Date.now()) return null;
    return data.email.toLowerCase();
  } catch {
    return null;
  }
}

async function sameSecret(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

export async function authenticateAdmin(email: string, password: string): Promise<string | null> {
  const configuredPassword = getBindings().ADMIN_PASSWORD;
  if (!configuredPassword || configuredAdminEmails().length === 0) return null;
  const normalizedEmail = email.trim().toLowerCase();
  if (!configuredAdminEmails().includes(normalizedEmail)) return null;
  if (!(await sameSecret(password, configuredPassword))) return null;
  return createSessionToken(normalizedEmail, configuredPassword);
}

export function adminSessionCookie(token: string, secure: boolean): string {
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(secure: boolean): string {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function getAdminAccess(headers: HeaderReader, host?: string | null): Promise<AdminAccess> {
  if (isLocalHost(host ?? headers.get("host"))) {
    return {
      allowed: true,
      identity: { email: "local@preview", userId: "local-preview" },
    };
  }

  const identityEmail =
    headers.get("oai-authenticated-user-email") ??
    headers.get("cf-access-authenticated-user-email");
  const identityUserId =
    headers.get("oai-authenticated-user-id") ??
    headers.get("cf-access-jwt-assertion") ??
    identityEmail;
  const configuredEmails = configuredAdminEmails();

  if (identityEmail && identityUserId) {
    if (!configuredEmails.includes(identityEmail.toLowerCase())) {
      return { allowed: false, reason: "not-allowed" };
    }
    return { allowed: true, identity: { email: identityEmail, userId: identityUserId } };
  }

  const configuredPassword = getBindings().ADMIN_PASSWORD;
  if (!configuredPassword || configuredEmails.length === 0) {
    return { allowed: false, reason: "not-configured" };
  }

  const token = readCookie(headers, sessionCookieName);
  if (!token) return { allowed: false, reason: "signed-out" };
  const email = await sessionEmail(token, configuredPassword);
  if (!email) return { allowed: false, reason: "signed-out" };
  if (!configuredEmails.includes(email)) return { allowed: false, reason: "not-allowed" };

  return { allowed: true, identity: { email, userId: `password:${email}` } };
}

export async function requireAdmin(request: Request): Promise<AdminIdentity | Response> {
  const access = await getAdminAccess(request.headers, new URL(request.url).host);
  if (access.allowed) return access.identity;

  const status = access.reason === "signed-out" ? 401 : 403;
  const message = access.reason === "signed-out"
    ? "Необходимо е да влезете в администраторския панел."
    : "Този профил няма достъп до администраторския панел.";
  return Response.json({ error: message }, { status });
}
