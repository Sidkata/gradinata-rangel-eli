import { headers } from "next/headers";
import Link from "next/link";
import { getAdminAccess } from "../../src/server/admin-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requestHeaders = await headers();
  const access = getAdminAccess(requestHeaders, requestHeaders.get("host"));

  if (!access.allowed) {
    return (
      <main className="admin-gate">
        <div className="admin-gate__card">
          <span className="admin-gate__mark" aria-hidden="true">Р & Е</span>
          <p className="admin-eyebrow">Управление на сайта</p>
          <h1>Администраторски панел</h1>
          <p>
            {access.reason === "not-allowed"
              ? "Този профил няма разрешение да редактира сайта."
              : access.reason === "not-configured"
                ? "Панелът е готов, но профилът на собственика трябва да бъде разрешен при публикуването."
                : "Влезте със своя профил, за да редактирате продукцията и снимките."}
          </p>
          {access.reason === "signed-out" && (
            <a className="admin-button admin-button--primary" href="/signin-with-chatgpt?return_to=%2Fadmin">
              Вход за администратор
            </a>
          )}
          <Link className="admin-back-link" href="/">← Обратно към сайта</Link>
        </div>
      </main>
    );
  }

  return <AdminClient identityEmail={access.identity.email} />;
}
