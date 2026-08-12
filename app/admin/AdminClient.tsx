"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { ManagedGalleryItem, ManagedProduct, ManagedRepairService } from "../../src/server/content-store";

type ManagedContent = {
  products: ManagedProduct[];
  repairServices?: ManagedRepairService[];
  galleryItems: ManagedGalleryItem[];
};

type Notice = { type: "success" | "error"; text: string } | null;

const statusOptions: Array<{ value: ManagedProduct["status"]; label: string }> = [
  { value: "available", label: "В наличност" },
  { value: "soon", label: "Очакваме скоро" },
  { value: "finished", label: "Сезонът приключи" },
];

const galleryCategories = ["Градината", "Продукция", "Ремонти", "Завършени обекти"];

async function apiError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error ?? "Възникна грешка.";
  } catch {
    return "Възникна грешка.";
  }
}

export default function AdminClient({ identityEmail }: { identityEmail: string }) {
  const [content, setContent] = useState<ManagedContent | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    if (!response.ok) throw new Error(await apiError(response));
    setContent(await response.json() as ManagedContent);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiError(response));
        return response.json() as Promise<ManagedContent>;
      })
      .then((nextContent) => {
        if (active) setContent(nextContent);
      })
      .catch((error: unknown) => {
        if (active) setNotice({ type: "error", text: error instanceof Error ? error.message : "Данните не могат да бъдат заредени." });
      });
    return () => { active = false; };
  }, []);

  const updateProductField = <K extends keyof ManagedProduct>(id: string, field: K, value: ManagedProduct[K]) => {
    setContent((current) => current ? {
      ...current,
      products: current.products.map((product) => product.id === id ? { ...product, [field]: value } : product),
    } : current);
  };

  const saveProduct = async (event: FormEvent, product: ManagedProduct) => {
    event.preventDefault();
    setBusy(`save-${product.id}`);
    setNotice(null);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        icon: product.icon,
        status: product.status,
        price: product.price,
      }),
    });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `${product.name} е обновен.` });
    await loadContent();
  };

  const uploadProductImage = async (product: ManagedProduct, file: File | undefined) => {
    if (!file) return;
    setBusy(`image-${product.id}`);
    setNotice(null);
    const form = new FormData();
    form.set("kind", "product");
    form.set("targetId", product.id);
    form.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `Снимката за ${product.name} е качена.` });
    await loadContent();
  };

  const addProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("product-new");
    setNotice(null);
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        icon: form.get("icon"),
        status: form.get("status"),
        price: form.get("price"),
      }),
    });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    formElement.reset();
    setNotice({ type: "success", text: "Новият продукт е добавен. Вече можете да му качите снимка." });
    await loadContent();
  };

  const removeProduct = async (product: ManagedProduct) => {
    if (!window.confirm(`Да премахнем ли продукта „${product.name}“?`)) return;
    setBusy(`delete-product-${product.id}`);
    setNotice(null);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `${product.name} е премахнат.` });
    await loadContent();
  };

  const updateServiceField = <K extends keyof ManagedRepairService>(id: string, field: K, value: ManagedRepairService[K]) => {
    setContent((current) => current ? {
      ...current,
      repairServices: (current.repairServices ?? []).map((service) => service.id === id ? { ...service, [field]: value } : service),
    } : current);
  };

  const saveService = async (event: FormEvent, service: ManagedRepairService) => {
    event.preventDefault();
    setBusy(`save-service-${service.id}`);
    setNotice(null);
    const response = await fetch(`/api/admin/services/${encodeURIComponent(service.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        icon: service.icon,
        title: service.title,
        description: service.description,
        price: service.price,
      }),
    });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `${service.title} е обновена.` });
    await loadContent();
  };

  const uploadServiceImage = async (service: ManagedRepairService, file: File | undefined) => {
    if (!file) return;
    setBusy(`image-service-${service.id}`);
    setNotice(null);
    const form = new FormData();
    form.set("kind", "service");
    form.set("targetId", service.id);
    form.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `Снимката за ${service.title} е качена.` });
    await loadContent();
  };

  const addService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("service-new");
    setNotice(null);
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        icon: form.get("icon"),
        title: form.get("title"),
        description: form.get("description"),
        price: form.get("price"),
      }),
    });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    formElement.reset();
    setNotice({ type: "success", text: "Новата услуга е добавена в „Ремонти“." });
    await loadContent();
  };

  const removeService = async (service: ManagedRepairService) => {
    if (!window.confirm(`Да премахнем ли услугата „${service.title}“?`)) return;
    setBusy(`delete-service-${service.id}`);
    setNotice(null);
    const response = await fetch(`/api/admin/services/${encodeURIComponent(service.id)}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: `${service.title} е премахната.` });
    await loadContent();
  };

  const addGalleryImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy("gallery-new");
    setNotice(null);
    const form = new FormData(formElement);
    form.set("kind", "gallery");
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    formElement.reset();
    setNotice({ type: "success", text: "Новата снимка е добавена в галерията." });
    await loadContent();
  };

  const deleteGalleryImage = async (item: ManagedGalleryItem) => {
    if (!window.confirm(`Да премахнем ли „${item.title}“?`)) return;
    setBusy(`delete-${item.id}`);
    setNotice(null);
    const response = await fetch(`/api/admin/gallery/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) return setNotice({ type: "error", text: await apiError(response) });
    setNotice({ type: "success", text: "Снимката е премахната." });
    await loadContent();
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Рангел и Ели · Старо Железаре</p>
          <h1>Управление на сайта</h1>
        </div>
        <div className="admin-header__actions">
          <span>{identityEmail === "local@preview" ? "Локален преглед" : identityEmail}</span>
          <a className="admin-button" href="/" target="_blank" rel="noreferrer">Виж сайта ↗</a>
        </div>
      </header>

      {notice && <div className={`admin-notice admin-notice--${notice.type}`} role="status">{notice.text}</div>}

      {!content ? (
        <div className="admin-loading">Зареждане на съдържанието…</div>
      ) : (
        <div className="admin-layout">
          <section className="admin-section" aria-labelledby="products-title">
            <div className="admin-section__heading">
              <div><p className="admin-eyebrow">Градина</p><h2 id="products-title">Продукция и наличности</h2></div>
              <p>Променете текста, наличността, незадължителната цена или снимката на всеки продукт.</p>
            </div>
            <form className="admin-create-form admin-create-form--product" onSubmit={addProduct}>
              <label>Име<input name="name" required placeholder="Например: Чушки" /></label>
              <label>Описание<input name="description" required placeholder="Кратко описание на продукта" /></label>
              <label>Символ (по желание)<input name="icon" placeholder="напр. 🍑" aria-label="Символ на продукта" /></label>
              <label>Наличност<select name="status" defaultValue="soon">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label>Цена (по желание)<input name="price" placeholder="напр. 4 €/кг" /></label>
              <button className="admin-button admin-button--primary" type="submit" disabled={busy !== null}>{busy === "product-new" ? "Добавяне…" : "+ Добави продукт"}</button>
            </form>
            <div className="admin-product-grid">
              {content.products.map((product) => (
                <form className="admin-product" key={product.id} onSubmit={(event) => saveProduct(event, product)}>
                  <div className="admin-product__image">
                    {product.image ? <Image src={product.image} alt={product.name} fill sizes="280px" unoptimized /> : <span aria-hidden="true">{product.icon}</span>}
                  </div>
                  <label>Име<input value={product.name} onChange={(event) => updateProductField(product.id, "name", event.target.value)} /></label>
                  <label>Описание<textarea rows={3} value={product.description} onChange={(event) => updateProductField(product.id, "description", event.target.value)} /></label>
                  <div className="admin-fields-row">
                    <label>Символ (по желание)<input className="admin-icon-input" value={product.icon} onChange={(event) => updateProductField(product.id, "icon", event.target.value)} placeholder="напр. 🍑" /></label>
                    <label>Наличност<select value={product.status} onChange={(event) => updateProductField(product.id, "status", event.target.value as ManagedProduct["status"])}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  </div>
                  <label>Цена (по желание)<input value={product.price ?? ""} onChange={(event) => updateProductField(product.id, "price", event.target.value || null)} placeholder="напр. 4 €/кг" /></label>
                  <div className="admin-product__actions">
                    <button className="admin-button admin-button--primary" type="submit" disabled={busy !== null}>{busy === `save-${product.id}` ? "Запазване…" : "Запази"}</button>
                    <label className="admin-button admin-button--upload">{busy === `image-${product.id}` ? "Качване…" : "Смени снимката"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadProductImage(product, event.target.files?.[0])} disabled={busy !== null} /></label>
                  </div>
                  <button className="admin-remove-button" type="button" onClick={() => removeProduct(product)} disabled={busy !== null}>{busy === `delete-product-${product.id}` ? "Премахване…" : "Премахни продукт"}</button>
                </form>
              ))}
            </div>
          </section>

          <section className="admin-section" aria-labelledby="services-title">
            <div className="admin-section__heading">
              <div><p className="admin-eyebrow">Ремонти</p><h2 id="services-title">Услуги на Рангел</h2></div>
              <p>Добавяйте услуги, снимки и незадължителни цени или премахвайте това, което вече не предлагате.</p>
            </div>
            <form className="admin-create-form admin-create-form--service" onSubmit={addService}>
              <label>Символ<input name="icon" required defaultValue="⌂" aria-label="Символ на услугата" /></label>
              <label>Име на услугата<input name="title" required placeholder="Например: Ремонт на покриви" /></label>
              <label>Кратко описание<input name="description" required placeholder="Какво включва услугата" /></label>
              <label>Цена (по желание)<input name="price" placeholder="напр. от 25 €/м²" /></label>
              <button className="admin-button admin-button--primary" type="submit" disabled={busy !== null}>{busy === "service-new" ? "Добавяне…" : "+ Добави услуга"}</button>
            </form>
            <div className="admin-service-list">
              {(content.repairServices ?? []).map((service) => (
                <form className="admin-service-item" key={service.id} onSubmit={(event) => saveService(event, service)}>
                  <div className="admin-service-item__image">
                    {service.image ? <Image src={service.image} alt={service.title} fill sizes="260px" unoptimized /> : <span aria-hidden="true">{service.icon}</span>}
                  </div>
                  <div className="admin-service-item__fields">
                    <div className="admin-fields-row">
                      <label>Символ<input className="admin-icon-input" value={service.icon} onChange={(event) => updateServiceField(service.id, "icon", event.target.value)} /></label>
                      <label>Име<input value={service.title} onChange={(event) => updateServiceField(service.id, "title", event.target.value)} /></label>
                    </div>
                    <label>Описание<textarea rows={3} value={service.description} onChange={(event) => updateServiceField(service.id, "description", event.target.value)} /></label>
                    <label>Цена (по желание)<input value={service.price ?? ""} onChange={(event) => updateServiceField(service.id, "price", event.target.value || null)} placeholder="напр. от 25 €/м²" /></label>
                    <div className="admin-product__actions">
                      <button className="admin-button admin-button--primary" type="submit" disabled={busy !== null}>{busy === `save-service-${service.id}` ? "Запазване…" : "Запази"}</button>
                      <label className="admin-button admin-button--upload">{busy === `image-service-${service.id}` ? "Качване…" : "Смени снимката"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadServiceImage(service, event.target.files?.[0])} disabled={busy !== null} /></label>
                    </div>
                    <button className="admin-remove-button" type="button" onClick={() => removeService(service)} disabled={busy !== null}>{busy === `delete-service-${service.id}` ? "Премахване…" : "Премахни услуга"}</button>
                  </div>
                </form>
              ))}
            </div>
          </section>

          <section className="admin-section" aria-labelledby="gallery-title">
            <div className="admin-section__heading">
              <div><p className="admin-eyebrow">Снимки</p><h2 id="gallery-title">Галерия</h2></div>
              <p>Изберете раздел, добавете заглавие и качете снимка до 8 MB.</p>
            </div>
            <form className="admin-gallery-form" onSubmit={addGalleryImage}>
              <label>Раздел<select name="category" required defaultValue="Градината">{galleryCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Заглавие<input name="title" required placeholder="Например: Новата реколта" /></label>
              <label className="admin-file-field">Снимка<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
              <button className="admin-button admin-button--primary" type="submit" disabled={busy !== null}>{busy === "gallery-new" ? "Качване…" : "Добави в галерията"}</button>
            </form>
            <div className="admin-gallery-grid">
              {content.galleryItems.map((item) => (
                <article className="admin-gallery-item" key={item.id}>
                  <div>{item.image ? <Image src={item.image} alt={item.title} fill sizes="240px" unoptimized /> : <span aria-hidden="true">{item.icon}</span>}</div>
                  <small>{item.category}</small>
                  <h3>{item.title}</h3>
                  {item.custom ? <button type="button" onClick={() => deleteGalleryImage(item)} disabled={busy !== null}>{busy === `delete-${item.id}` ? "Премахване…" : "Премахни"}</button> : <span className="admin-gallery-item__original">Първоначална снимка</span>}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
