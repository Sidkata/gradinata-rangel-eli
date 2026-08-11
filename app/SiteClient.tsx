"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  galleryItems,
  navigation,
  products,
  repairServices,
  site,
  statusLabels,
  type ImageAsset,
} from "../src/data/site";

type GalleryItem = (typeof galleryItems)[number];

function Placeholder({ asset, className = "" }: { asset: ImageAsset; className?: string }) {
  if (asset.src) {
    return <Image className={`image-actual ${className}`} src={asset.src} alt={asset.alt} fill sizes="(max-width: 850px) 100vw, 50vw" unoptimized />;
  }

  return (
    <div
      className={`image-placeholder image-placeholder--${asset.tone} ${className}`}
      role="img"
      aria-label={asset.alt}
    >
      <span className="image-placeholder__mark" aria-hidden="true">✦</span>
      <span>{asset.placeholder}</span>
      <small>лесно заменяема снимка</small>
    </div>
  );
}

type ContactKey = keyof typeof site.contacts;

function PhoneLink({ className = "", contact, children }: { className?: string; contact?: ContactKey; children: React.ReactNode }) {
  const person = contact ? site.contacts[contact] : null;
  const href = person ? `tel:${person.phoneHref}` : "#kontakti";

  return (
    <a className={className} href={href} aria-label={person ? `Обади се на ${person.name}: ${person.phoneDisplay}` : "Виж телефоните за контакт"}>
      {children}
    </a>
  );
}

export default function SiteClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState("Всички");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    document.body.style.overflow = lightboxItem ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxItem]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxItem(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const visibleGallery = galleryFilter === "Всички"
    ? galleryItems
    : galleryItems.filter((item) => item.category === galleryFilter);

  return (
    <>
      <a className="skip-link" href="#main">Към основното съдържание</a>

      <header className="site-header">
        <div className="topbar">
          <div className="container topbar__inner">
            <p><span aria-hidden="true">⌖</span> {site.location}, България</p>
            <p className="topbar__promise">Сезонна продукция · Ремонти за дома и двора</p>
          </div>
        </div>
        <div className="container nav-wrap">
          <a href="#nachalo" className="brand" aria-label={`${site.name} — начало`}>
            <Image
              className="brand__logo"
              src="/images/logo-rangel-eli.png"
              alt={site.name}
              width={1000}
              height={238}
              priority
              unoptimized
            />
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Отвори меню</span>
            <span /><span /><span />
          </button>

          <nav id="main-navigation" className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Основна навигация">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <PhoneLink className="nav-call"><span aria-hidden="true">☎</span> Обади се</PhoneLink>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="nachalo">
          <div className="container hero__grid">
            <div className="hero__copy">
              <p className="eyebrow"><span /> Семейна градина в Старо Железаре</p>
              <h1>Градината на<br /><em>Рангел и Ели</em></h1>
              <p className="hero__lead">Домашна продукция от Старо Железаре</p>
              <p className="hero__body">Сезонни плодове, зеленчуци и разсад, отгледани с грижа в нашата градина.</p>
              <div className="hero__actions">
                <a className="button button--primary" href="#produktsiya">Виж продукцията <span aria-hidden="true">↓</span></a>
                <PhoneLink className="button button--secondary" contact="eli"><span aria-hidden="true">☎</span> Обади се на Ели за наличност</PhoneLink>
              </div>
              <p className="hero__note"><span aria-hidden="true">✦</span> Малко стопанство. Личен контакт. Истински сезонен вкус.</p>
            </div>
            <div className="hero__visual">
              <Placeholder asset={site.images.hero} />
              <div className="hero__stamp" aria-hidden="true"><strong>от нашата</strong><span>градина</span><small>с грижа</small></div>
              <div className="hero__caption">{site.images.hero.caption}</div>
            </div>
          </div>
          <div className="garden-line" aria-hidden="true" />
        </section>

        <section className="section products-section" id="produktsiya">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow"><span /> От нашите лехи и дръвчета</p>
                <h2>Какво расте<br /><em>в градината</em></h2>
              </div>
              <p>Наличностите се променят с времето и сезона — точно както е естествено в една истинска градина.</p>
            </div>

            <div className="product-grid">
              {products.map((product, index) => {
                const status = statusLabels[product.status];
                return (
                  <article className="product-card" key={product.name}>
                    <div className={`product-card__image product-card__image--${(index % 4) + 1}`}>
                      {product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 560px) 100vw, (max-width: 1040px) 50vw, 25vw" unoptimized /> : <span aria-hidden="true">{product.icon}</span>}
                      {!product.image && <small>място за снимка</small>}
                    </div>
                    <div className="product-card__body">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <span className={`status status--${product.status}`}><i aria-hidden="true">{status.symbol}</i> {status.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="season-note">
              <div className="season-note__icon" aria-hidden="true">☀</div>
              <p><strong>Продукцията ни е сезонна.</strong><br />Обадете се, за да проверите текущата наличност и цена.</p>
              <PhoneLink className="button button--dark" contact="eli"><span aria-hidden="true">☎</span> Обади се на Ели</PhoneLink>
            </div>
          </div>
        </section>

        <section className="section story-section" id="za-nas">
          <div className="container story-grid">
            <div className="story-visual">
              <Placeholder asset={site.images.family} />
              <div className="story-visual__secondary">
                <Placeholder asset={site.images.familySecondary} />
              </div>
              <div className="story-visual__label"><span>Оттук започва всичко</span><strong>{site.location}</strong></div>
            </div>
            <div className="story-copy">
              <p className="eyebrow eyebrow--light"><span /> Нашата история</p>
              <h2>Двама души.<br />Една градина.<br /><em>Много грижа.</em></h2>
              <p className="story-copy__lead">{site.about}</p>
              <div className="values-row">
                <div><strong>01</strong><span>Сезонен<br />вкус</span></div>
                <div><strong>02</strong><span>Грижа за<br />растенията</span></div>
                <div><strong>03</strong><span>Личен<br />контакт</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section repairs-section" id="remonti">
          <div className="container">
            <div className="repairs-intro">
              <div>
                <p className="eyebrow eyebrow--brick"><span /> Майсторски услуги от Рангел</p>
                <h2>Ремонти и<br /><em>строителство</em></h2>
              </div>
              <div>
                <h3>Практични решения за дома и двора</h3>
                <p>Рангел извършва различни строително-ремонтни дейности. Обадете се, за да обсъдите конкретната работа, мястото и възможностите.</p>
              </div>
            </div>

            <div className="services-grid">
              {repairServices.map((service, index) => (
                <article className="service-card" key={service}>
                  <span className="service-card__number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{service}</h3>
                  <span className="service-card__arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>

            <div className="repair-cta">
              <div aria-hidden="true" className="repair-cta__mark">Р</div>
              <p><strong>Имате нещо за ремонт?</strong><br />Обадете се и го обсъдете директно с Рангел.</p>
              <PhoneLink className="button button--cream" contact="rangel"><span aria-hidden="true">☎</span> Обади се на Рангел</PhoneLink>
            </div>
          </div>
        </section>

        <section className="section gallery-section" id="galeriya">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow"><span /> Снимки от живота и работата</p>
                <h2>Нашата<br /><em>галерия</em></h2>
              </div>
              <div className="gallery-filters" role="group" aria-label="Филтрирай галерията">
                {["Всички", "Градината", "Продукция", "Ремонти", "Завършени обекти"].map((filter) => (
                  <button key={filter} type="button" className={galleryFilter === filter ? "is-active" : ""} onClick={() => setGalleryFilter(filter)}>{filter}</button>
                ))}
              </div>
            </div>

            <div className="gallery-grid">
              {visibleGallery.map((item, index) => (
                <button
                  className={`gallery-item gallery-item--${item.tone} ${index === 0 ? "gallery-item--large" : ""}`}
                  type="button"
                  key={item.id}
                  onClick={() => setLightboxItem(item)}
                  aria-label={`Отвори: ${item.title}`}
                >
                  {item.image ? <Image src={item.image} alt={item.title} fill sizes="(max-width: 560px) 100vw, (max-width: 850px) 50vw, 33vw" unoptimized /> : <div className="gallery-item__placeholder"><span aria-hidden="true">{item.icon}</span><small>{item.placeholder}</small></div>}
                  <span className="gallery-item__caption"><small>{item.category}</small><strong>{item.title}</strong></span>
                  <span className="gallery-item__open" aria-hidden="true">＋</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="location-section" id="kontakti">
          <div className="location-map">
            <iframe src={site.mapsEmbedUrl} title="Карта на Старо Железаре" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="location-card">
            <p className="eyebrow eyebrow--light"><span /> Къде сме</p>
            <h2>{site.location}</h2>
            <p>В сърцето на Тракия, близо до Хисаря. Точните указания ще уточним по телефона.</p>
            <p className="location-card__market"><span aria-hidden="true">✦</span> {site.marketNote}</p>
            <a className="button button--cream" href={site.mapsSearchUrl} target="_blank" rel="noreferrer">Отвори в Google Maps <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="contact-section">
          <div className="container contact-grid">
            <div>
              <p className="eyebrow"><span /> Свържете се с нас</p>
              <h2>Най-лесно е<br /><em>по телефона.</em></h2>
            </div>
            <div className="contact-details">
              <p className="contact-details__name">{site.name}</p>
              <p><span aria-hidden="true">⌖</span> {site.location}<br /><span aria-hidden="true">✦</span> {site.marketNote}</p>
              <div className="contact-cards">
                {(Object.keys(site.contacts) as ContactKey[]).map((key) => {
                  const contact = site.contacts[key];
                  return (
                    <article className="contact-card" key={key}>
                      <span className="contact-card__role">{contact.role}</span>
                      <h3>{contact.name}</h3>
                      <a className="contact-phone" href={`tel:${contact.phoneHref}`}><span aria-hidden="true">☎</span> {contact.phoneDisplay}</a>
                      <div className="contact-actions">
                        <a className="button button--primary" href={`tel:${contact.phoneHref}`}>Позвъни</a>
                        <a className="button button--viber" href={contact.viberHref} aria-label={`Пиши на ${contact.name} във Viber`}>Viber</a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <a href="#nachalo" className="brand brand--footer">
            <Image
              className="brand__logo"
              src="/images/logo-rangel-eli.png"
              alt={site.name}
              width={1000}
              height={238}
              unoptimized
            />
          </a>
          <p>Домашна продукция и майсторски услуги<br />от {site.location}.</p>
          <nav aria-label="Навигация във футъра">
            {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} {site.name}</p>
          <p>Направено с грижа в Старо Железаре</p>
        </div>
      </footer>

      <PhoneLink className="mobile-call"><span aria-hidden="true">☎</span> Обади се</PhoneLink>

      {lightboxItem && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lightboxItem.title} onClick={() => setLightboxItem(null)}>
          <button type="button" className="lightbox__close" onClick={() => setLightboxItem(null)} aria-label="Затвори">×</button>
          <div className="lightbox__content" onClick={(event) => event.stopPropagation()}>
            {lightboxItem.image ? <div className="lightbox__image"><Image src={lightboxItem.image} alt={lightboxItem.title} fill sizes="90vw" unoptimized /></div> : <div className={`lightbox__placeholder lightbox__placeholder--${lightboxItem.tone}`}><span aria-hidden="true">{lightboxItem.icon}</span><small>{lightboxItem.placeholder}</small></div>}
            <div><small>{lightboxItem.category}</small><h2>{lightboxItem.title}</h2></div>
          </div>
        </div>
      )}
    </>
  );
}
