import { headers } from "next/headers";
import Link from "next/link";
import { getAdminAccess } from "../../src/server/admin-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const requestHeaders = await headers();
  const access = await getAdminAccess(requestHeaders, requestHeaders.get("host"));
  const { error } = await searchParams;

  if (!access.allowed) {
    return (
      <main className="admin-gate">
        <div className="admin-gate__card">
          <span className="admin-gate__mark" aria-hidden="true">Р & Е</span>
          <p className="admin-eyebrow">Управление на сайта</p>
          <h1>Администраторски<br />панел</h1>
          <p>
            {access.reason === "not-allowed"
              ? "Този профил няма разрешение да редактира сайта."
              : access.reason === "not-configured"
                ? "Въведете имейла и паролата за администраторски достъп."
                : "Влезте с имейл и парола, за да редактирате продукцията, услугите и снимките."}
          </p>
          {access.reason === "not-configured" && (
            <p className="admin-setup-notice" role="status">
              Паролата за панела още не е активирана в Cloudflare.
            </p>
          )}
          {error === "invalid" && (
            <p className="admin-login-error" role="alert">Имейлът или паролата не са правилни.</p>
          )}
          {(access.reason === "signed-out" || access.reason === "not-configured") && (
            <form className="admin-login-form" action="/api/admin/login" method="post">
              <label>
                Имейл
                <input name="email" type="email" defaultValue="elena208@abv.bg" autoComplete="username" required />
              </label>
              <label>
                Парола
                <input name="password" type="password" autoComplete="current-password" required />
              </label>
              <button className="admin-button admin-button--primary" type="submit">Вход за администратор</button>
            </form>
          )}
          <Link className="admin-back-link" href="/">← Обратно към сайта</Link>
        </div>
      </main>
    );
  }

  return <AdminClient identityEmail={access.identity.email} />;
}
