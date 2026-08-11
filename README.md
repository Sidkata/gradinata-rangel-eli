# Градината на Рангел и Ели

Лек, responsive сайт на български за семейната градина и ремонтните услуги на
Рангел в с. Старо Железаре. Сайтът е без backend и се експортира като статични
файлове за Cloudflare Pages.

## Какво се редактира най-често

Всички основни данни са събрани в `src/data/site.ts`:

- телефон и име;
- населено място;
- продукти и статуси;
- ремонтни услуги;
- линкове към социални мрежи;
- hero, семейна, продуктови и галерийни снимки.

За реални снимки добавете оптимизирани `.webp` или `.jpg` файлове в
`public/images/` и посочете техните пътища в `src/data/site.ts`. Допълнителни
насоки има в `public/images/README.md`.

## 1. Стартиране локално

Необходим е Node.js 22.13 или по-нова версия.

```bash
npm install
npm run dev
```

Отворете адреса, показан в терминала (обикновено `http://localhost:3000`).

Пълна проверка преди публикуване:

```bash
npm test
```

## 2. Качване в GitHub

Създайте празно GitHub repository, след което в папката на проекта изпълнете:

```bash
git init
git add .
git commit -m "Първа версия на сайта"
git branch -M main
git remote add origin https://github.com/ВАШЕТО-ИМЕ/gradinata-rangel-eli.git
git push -u origin main
```

Заменете `ВАШЕТО-ИМЕ` с вашето GitHub потребителско име.

## 3. Безплатен deployment в Cloudflare Pages

1. Влезте в Cloudflare Dashboard.
2. Отворете **Workers & Pages** → **Create** → **Pages** → **Import an existing Git repository**.
3. Свържете GitHub и изберете repository-то на сайта.
4. В Build settings задайте:
   - **Framework preset:** None;
   - **Build command:** `npm run build`;
   - **Build output directory:** `dist/client`;
   - **Root directory:** оставете празно;
   - **Environment variable:** `NODE_VERSION` = `22.13.0`.
5. Натиснете **Save and Deploy**.

Cloudflare ще даде безплатен адрес от типа
`gradinata-rangel-eli.pages.dev`, ако това име е свободно. При всяко следващо
качване в `main` сайтът ще се обновява автоматично.

## 4. Собствен домейн по-късно

Сайтът работи и без собствен домейн. Ако по-късно добавите такъв, отворете
Cloudflare Pages проекта → **Custom domains** → **Set up a custom domain** и
следвайте стъпките. След това сменете временния `pages.dev` адрес в:

- `app/layout.tsx` (`metadataBase`);
- `app/robots.ts`;
- `app/sitemap.ts`;
- `scripts/export-static.mjs`.

## Полезни команди

```bash
npm run dev      # локална разработка
npm run build    # статичен build в dist/client
npm test         # build + автоматични проверки
npm run lint     # проверка на кода
```
