"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  galleryItems,
  navigation,
  products,
  repairSteps,
  repairServices,
  site,
  statusLabels,
  type ImageAsset,
} from "../src/data/site";
import type { ManagedGalleryItem, ManagedProduct, ManagedRepairService } from "../src/server/content-store";

type GalleryItem = ManagedGalleryItem;
type SiteMode = "garden" | "repairs";

const initialProducts: ManagedProduct[] = products.map((product, index) => ({
  ...product,
  id: `product-${index + 1}`,
  price: null,
  sortOrder: index,
  custom: false,
}));

const initialRepairServices: ManagedRepairService[] = repairServices.map((service, index) => ({
  ...service,
  id: `service-${index + 1}`,
  price: null,
  image: null,
  sortOrder: index,
  custom: false,
}));

const initialGalleryItems: ManagedGalleryItem[] = galleryItems.map((item) => ({
  ...item,
  custom: false,
}));

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
  const [siteMode, setSiteMode] = useState<SiteMode>("garden");
  const [galleryFilter, setGalleryFilter] = useState("Всички");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [managedProducts, setManagedProducts] = useState<ManagedProduct[]>(initialProducts);
  const [managedRepairServices, setManagedRepairServices] = useState<ManagedRepairService[]>(initialRepairServices);
  const [managedGalleryItems, setManagedGalleryItems] = useState<ManagedGalleryItem[]>(initialGalleryItems);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/content", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((content: { products?: ManagedProduct[]; repairServices?: ManagedRepairService[]; galleryItems?: ManagedGalleryItem[] } | null) => {
        if (Array.isArray(content?.products)) setManagedProducts(content.products);
        if (Array.isArray(content?.repairServices)) setManagedRepairServices(content.repairServices);
        if (Array.isArray(content?.galleryItems)) setManagedGalleryItems(content.galleryItems);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

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

  const isRepairs = siteMode === "repairs";
  const modeNavigation = navigation.filter((item) => isRepairs
    ? ["#nachalo", "#remonti", "#galeriya", "#kontakti"].includes(item.href)
    : item.href !== "#remonti");
  const galleryFilters = isRepairs
    ? ["Всички", "Ремонти", "Завършени обекти"]
    : ["Всички", "Градината", "Продукция"];
  const modeGalleryItems = managedGalleryItems.filter((item) => isRepairs
    ? item.category === "Ремонти" || item.category === "Завършени обекти"
    : item.category === "Градината" || item.category === "Продукция");
  const visibleGallery = galleryFilter === "Всички"
    ? modeGalleryItems
    : modeGalleryItems.filter((item) => item.category === galleryFilter);
  const visibleContacts: ContactKey[] = isRepairs ? ["rangel"] : ["eli"];

  const selectSiteMode = (mode: SiteMode) => {
    setSiteMode(mode);
    setGalleryFilter("Всички");
    setMenuOpen(false);
  };

  const handleNavigation = (href: string) => {
    if (href === "#remonti") selectSiteMode("repairs");
    if (href === "#produktsiya" || href === "#za-nas") selectSiteMode("garden");
    setMenuOpen(false);
  };

  return (
    <>
      <a className="skip-link" href="#main">Към основното съдържание</a>

      <header className="site-header">
        <div className="topbar">
          <div className="container topbar__inner">
            <p><span aria-hidden="true">⌖</span> {site.location}, България</p>
            <p className="topbar__promise">{isRepairs ? "Ремонти за дома и двора" : "Сезонна продукция от семейната градина"}</p>
          </div>
        </div>
        <div className="container nav-wrap">
          <a href="#nachalo" className="brand" aria-label={`${site.name} — начало`}>
            <Image
              className="brand__site-logo"
              src="/images/logo-site-rangel-eli-new.png"
              alt="Рангел и Ели — Старо Железаре, от нашия двор, с наши ръце"
              width={220}
              height={103}
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
            {modeNavigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => handleNavigation(item.href)}>{item.label}</a>
            ))}
            <PhoneLink className="nav-call" contact={isRepairs ? "rangel" : "eli"}><span aria-hidden="true">☎</span> Обади се</PhoneLink>
          </nav>
        </div>
      </header>

      <main id="main" className={`site-main site-main--${siteMode}`}>
        <section className={`hero ${isRepairs ? "hero--repairs" : "hero--garden"}`} id="nachalo">
          <div className="container mode-switch-wrap">
            <div className="mode-switch" role="group" aria-label="Избери част от сайта">
              <button
                type="button"
                className={!isRepairs ? "is-active" : ""}
                aria-pressed={!isRepairs}
                onClick={() => selectSiteMode("garden")}
              >
                <span className="mode-switch__garden-icon" aria-hidden="true" />
                <small>Продукция</small>
                <strong>Градината</strong>
              </button>
              <button
                type="button"
                className={isRepairs ? "is-active" : ""}
                aria-pressed={isRepairs}
                onClick={() => selectSiteMode("repairs")}
              >
                <span className="mode-switch__repair-icon" aria-hidden="true" />
                <small>Услуги</small>
                <strong>Ремонтите на Рангел</strong>
              </button>
            </div>
          </div>
          <div className="container hero__grid">
            <div className="hero__copy">
              <p className="eyebrow"><span /> {isRepairs ? "Майсторски услуги в района" : "Семейна градина в Старо Железаре"}</p>
              <h1>{isRepairs ? <>Ремонтите на<br /><em>Рангел</em></> : <>Градината на<br /><em>Рангел и Ели</em></>}</h1>
              <p className="hero__lead">{isRepairs ? "Практични решения за дома и двора" : "Домашна продукция от Старо Железаре"}</p>
              <p className="hero__body">{isRepairs ? "Вътрешни и външни ремонти, зидария, боядисване, плочки и други строителни дейности — с директна уговорка с Рангел." : "Сезонни плодове, зеленчуци и разсад, отгледани с грижа в нашата градина."}</p>
              <div className="hero__actions">
                <a className="button button--primary" href={isRepairs ? "#remonti" : "#produktsiya"}>{isRepairs ? "Виж ремонтните услуги" : "Виж продукцията"} <span aria-hidden="true">↓</span></a>
                <PhoneLink className="button button--secondary" contact={isRepairs ? "rangel" : "eli"}><span aria-hidden="true">☎</span> {isRepairs ? "Обади се на Рангел" : "Обади се на Ели за наличност"}</PhoneLink>
              </div>
              <p className="hero__note"><span aria-hidden="true">✦</span> {isRepairs ? "Лична уговорка. Практичен подход. Работа според конкретния обект." : "Малко стопанство. Личен контакт. Истински сезонен вкус."}</p>
            </div>
            <div className={`hero__visual ${isRepairs ? "hero__visual--repairs" : ""}`}>
              {isRepairs ? (
                <div className="repair-hero-card" aria-label="Част от ремонтните услуги на Рангел">
                  <Image
                    className="repair-hero-card__photo"
                    src="/images/repairs/remont-bar-v-proces.jpg"
                    alt="Ремонт на заведение в Хисаря в процес на изпълнение"
                    fill
                    sizes="(max-width: 850px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                  <div className="hero__stamp hero__stamp--logo hero__stamp--repair-logo" aria-hidden="true">
                    <Image
                      src="/images/logo-remontite-rangel.png"
                      alt=""
                      fill
                      sizes="140px"
                      unoptimized
                    />
                  </div>
                  <div className="hero__caption">Ремонт на заведение в Хисаря.</div>
                </div>
              ) : (
                <>
                  <Placeholder asset={site.images.hero} />
                  <div className="hero__stamp hero__stamp--logo" aria-hidden="true">
                    <Image
                      src="/images/logo-gradinata-rangel-eli.png"
                      alt=""
                      fill
                      sizes="140px"
                      unoptimized
                    />
                  </div>
                  <div className="hero__caption">{site.images.hero.caption}</div>
                </>
              )}
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
              {managedProducts.map((product, index) => {
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
                      {product.price && <strong className="product-card__price">{product.price}</strong>}
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

            <div className="repair-trust" aria-label="Какво можете да очаквате">
              <div><span aria-hidden="true">✓</span><p><strong>Личен контакт</strong><small>Говорите директно с Рангел</small></p></div>
              <div><span aria-hidden="true">✓</span><p><strong>Ясна уговорка</strong><small>Обсъждате работата предварително</small></p></div>
              <div><span aria-hidden="true">✓</span><p><strong>Практичен подход</strong><small>Решение според конкретния обект</small></p></div>
            </div>

            <div className="services-grid">
              {managedRepairServices.map((service, index) => (
                <article className="service-card" key={service.title}>
                  {service.image && <div className="service-card__image"><Image src={service.image} alt={service.title} fill sizes="(max-width: 560px) 100vw, (max-width: 850px) 50vw, 33vw" unoptimized /></div>}
                  <div className="service-card__top"><span className="service-card__number">{String(index + 1).padStart(2, "0")}</span><span className="service-card__icon" aria-hidden="true">{service.icon}</span></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.price && <strong className="service-card__price">{service.price}</strong>}
                  <span className="service-card__arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>

            <div className="repair-process">
              <div className="repair-process__heading">
                <p className="eyebrow eyebrow--brick"><span /> От идеята до готовата работа</p>
                <h3>Как започваме</h3>
                <p>Не е нужно да знаете точните материали или всички подробности. Започнете с кратък разговор.</p>
              </div>
              <ol>
                {repairSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div><strong>{step.title}</strong><p>{step.description}</p></div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="repair-cta">
              <div aria-hidden="true" className="repair-cta__mark">Р</div>
              <p><strong>Имате нещо за ремонт?</strong><br />Изпратете снимка по Viber или го обсъдете директно с Рангел.</p>
              <div className="repair-cta__actions">
                <PhoneLink className="button button--cream" contact="rangel"><span aria-hidden="true">☎</span> Обади се</PhoneLink>
                <a className="button button--viber" href={site.contacts.rangel.viberHref} aria-label="Пиши на Рангел във Viber">Viber</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section gallery-section" id="galeriya">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow"><span /> {isRepairs ? "Ремонти в процес и завършени обекти" : "Снимки от живота и работата"}</p>
                <h2>{isRepairs ? <>Работата на<br /><em>Рангел</em></> : <>Нашата<br /><em>галерия</em></>}</h2>
              </div>
              <div className="gallery-filters" role="group" aria-label="Филтрирай галерията">
                {galleryFilters.map((filter) => (
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
            <p>{isRepairs ? "Рангел работи в Старо Железаре и района. Мястото и конкретната работа ще уточните директно по телефона." : "В сърцето на Тракия, близо до Хисаря. Точните указания ще уточним по телефона."}</p>
            {!isRepairs && <p className="location-card__market"><span aria-hidden="true">✦</span> {site.marketNote}</p>}
            <a className="button button--cream" href={site.mapsSearchUrl} target="_blank" rel="noreferrer">Отвори в Google Maps <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="contact-section">
          <div className="container contact-grid">
            <div>
              <p className="eyebrow"><span /> {isRepairs ? "Свържете се с Рангел" : "Свържете се с Ели"}</p>
              <h2>{isRepairs ? <>Обсъдете ремонта<br /><em>директно.</em></> : <>Най-лесно е<br /><em>по телефона.</em></>}</h2>
            </div>
            <div className="contact-details">
              <p className="contact-details__name">{isRepairs ? "Ремонтите на Рангел" : site.name}</p>
              <p><span aria-hidden="true">⌖</span> {site.location}{!isRepairs && <><br /><span aria-hidden="true">✦</span> {site.marketNote}</>}</p>
              <div className="contact-cards contact-cards--single">
                {visibleContacts.map((key) => {
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
              className="brand__logo brand__logo--mode"
              src={isRepairs ? "/images/logo-remontite-rangel.png" : "/images/logo-gradinata-rangel-eli.png"}
              alt={isRepairs ? "Ремонтите на Рангел" : site.name}
              width={900}
              height={900}
              unoptimized
            />
          </a>
          <p>{isRepairs ? <>Майсторски услуги за дома и двора<br />от Рангел.</> : <>Домашна сезонна продукция<br />от {site.location}.</>}</p>
          <nav aria-label="Навигация във футъра">
            {modeNavigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} {site.name}</p>
          <p>Направено с грижа в Старо Железаре</p>
        </div>
      </footer>

      <PhoneLink className="mobile-call" contact={isRepairs ? "rangel" : "eli"}><span aria-hidden="true">☎</span> Обади се на {isRepairs ? "Рангел" : "Ели"}</PhoneLink>

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
