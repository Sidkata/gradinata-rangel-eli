import { clearAdminSessionCookie } from "../../../../src/server/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/admin", request.url).toString(),
      "Cache-Control": "no-store",
      "Set-Cookie": clearAdminSessionCookie(requestUrl.protocol === "https:"),
    },
  });
}
