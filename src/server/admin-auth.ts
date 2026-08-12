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

function isLocalHost(host: string | null): boolean {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getAdminAccess(headers: HeaderReader, host?: string | null): AdminAccess {
  if (isLocalHost(host ?? headers.get("host"))) {
    return {
      allowed: true,
      identity: { email: "local@preview", userId: "local-preview" },
    };
  }

  const email =
    headers.get("oai-authenticated-user-email") ??
    headers.get("cf-access-authenticated-user-email");
  const userId =
    headers.get("oai-authenticated-user-id") ??
    headers.get("cf-access-jwt-assertion") ??
    email;

  if (!email || !userId) return { allowed: false, reason: "signed-out" };

  const configured = getBindings().ADMIN_EMAILS?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) ?? defaultAdminEmails;

  if (configured.length === 0) return { allowed: false, reason: "not-configured" };
  if (!configured.includes(email.toLowerCase())) {
    return { allowed: false, reason: "not-allowed" };
  }

  return { allowed: true, identity: { email, userId } };
}

export function requireAdmin(request: Request): AdminIdentity | Response {
  const access = getAdminAccess(request.headers, new URL(request.url).host);
  if (access.allowed) return access.identity;

  const status = access.reason === "signed-out" ? 401 : 403;
  const message = access.reason === "signed-out"
    ? "Необходимо е да влезете в администраторския панел."
    : "Този профил няма достъп до администраторския панел.";
  return Response.json({ error: message }, { status });
}
