import { adminSessionCookie, authenticateAdmin } from "../../../../src/server/admin-auth";

export const dynamic = "force-dynamic";

function redirectToAdmin(request: Request, error?: string, cookie?: string): Response {
  const destination = new URL(error ? `/admin?error=${error}` : "/admin", request.url);
  const headers = new Headers({ Location: destination.toString(), "Cache-Control": "no-store" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return Response.json({ error: "Невалидна заявка." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectToAdmin(request, "invalid");
  }

  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const token = await authenticateAdmin(email, password);
  if (!token) return redirectToAdmin(request, "invalid");

  return redirectToAdmin(
    request,
    undefined,
    adminSessionCookie(token, requestUrl.protocol === "https:"),
  );
}
