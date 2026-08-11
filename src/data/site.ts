export type ProductStatus = "available" | "soon" | "finished";

export type ImageAsset = {
  src: string | null;
  alt: string;
  placeholder: string;
  tone: "leaf" | "sun" | "earth" | "stone";
  caption?: string;
};

export const site = {
  name: "Градината на Рангел и Ели",
  location: "с. Старо Железаре",
  marketNote: "Може да ни намерите и на пазара в гр. Хисаря.",
  contacts: {
    rangel: {
      name: "Рангел",
      role: "Ремонти и строителство",
      phoneDisplay: "+359 89 996 0149",
      phoneHref: "+359899960149",
      viberHref: "viber://chat?number=%2B359899960149",
    },
    eli: {
      name: "Ели",
      role: "Продукция и наличности",
      phoneDisplay: "+359 89 464 6086",
      phoneHref: "+359894646086",
      viberHref: "viber://chat?number=%2B359894646086",
    },
  },
  description:
    "Сезонни плодове, зеленчуци и разсад от Старо Железаре. Строително-ремонтни услуги от Рангел.",
  about:
    "Ние сме Рангел и Ели от Старо Железаре. Отглеждаме сезонни плодове, зеленчуци и разсад в нашата градина. За нас са важни добрият вкус, грижата за растенията и личният контакт с хората, които купуват от нас.",
  mapsSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=%D0%A1%D1%82%D0%B0%D1%80%D0%BE+%D0%96%D0%B5%D0%BB%D0%B5%D0%B7%D0%B0%D1%80%D0%B5",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=%D0%A1%D1%82%D0%B0%D1%80%D0%BE+%D0%96%D0%B5%D0%BB%D0%B5%D0%B7%D0%B0%D1%80%D0%B5&output=embed",
  social: {
    facebook: "",
    instagram: "",
  },
  images: {
    hero: {
      src: "/images/garden/rangel-tomatoes.webp",
      alt: "Рангел с касетка домати в оранжерията",
      placeholder: "Тук ще бъде снимка от градината",
      tone: "leaf",
      caption: "Рангел с част от лятната реколта.",
    } satisfies ImageAsset,
    family: {
      src: "/images/garden/eli-orchard.webp",
      alt: "Ели сред черешовите дръвчета в градината",
      placeholder: "Място за семейна снимка",
      tone: "sun",
    } satisfies ImageAsset,
    familySecondary: {
      src: "/images/garden/rangel-crate.webp",
      alt: "Рангел с касетка домашни домати",
      placeholder: "Място за снимка на Рангел",
      tone: "earth",
    } satisfies ImageAsset,
  },
} as const;

export const products = [
  {
    name: "Домати",
    icon: "🍅",
    description: "Сочни сезонни домати, отгледани с внимание.",
    status: "soon" as ProductStatus,
    image: "/images/garden/tomato-1290g.webp",
  },
  {
    name: "Краставици",
    icon: "🥒",
    description: "Свежи краставици директно от градината.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Тиквички",
    icon: "🥒",
    description: "Крехки тиквички за любимите летни рецепти.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Патладжани",
    icon: "🍆",
    description: "Сезонни патладжани с плътен вкус.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Ябълки",
    icon: "🍎",
    description: "Ароматни ябълки от нашите дръвчета.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Пъпеши",
    icon: "🍈",
    description: "Сладки пъпеши, когато сезонът им настъпи.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Череши",
    icon: "🍒",
    description: "Череши, брани в точния момент.",
    status: "soon" as ProductStatus,
    image: null,
  },
  {
    name: "Разсад",
    icon: "🌱",
    description: "Здрав сезонен разсад за вашата градина.",
    status: "soon" as ProductStatus,
    image: null,
  },
] as const;

export const repairServices = [
  "Вътрешни ремонти",
  "Външни ремонти",
  "Шпакловка и боядисване",
  "Зидария",
  "Плочки и настилки",
  "Ремонти на бани",
  "Външни бани и тоалетни",
  "Дворни постройки и подобрения",
  "Други строително-ремонтни дейности",
] as const;

export const galleryItems = [
  {
    id: "garden-1",
    category: "Градината",
    icon: "🌱",
    title: "Редове домати в оранжерията",
    image: "/images/garden/tomato-rows.webp",
    tone: "leaf" as const,
    placeholder: "Снимка от градината",
  },
  {
    id: "produce-1",
    category: "Продукция",
    icon: "🍅",
    title: "Лятна реколта от домати",
    image: "/images/garden/tomato-harvest.webp",
    tone: "sun" as const,
    placeholder: "Снимка на продукцията",
  },
  {
    id: "garden-2",
    category: "Градината",
    icon: "🌱",
    title: "Ели при черешите",
    image: "/images/garden/eli-orchard.webp",
    tone: "earth" as const,
    placeholder: "Снимка от градината",
  },
  {
    id: "repair-1",
    category: "Ремонти",
    icon: "🔨",
    title: "Работа в процес",
    image: null,
    tone: "stone" as const,
    placeholder: "Снимка от ремонт",
  },
  {
    id: "finished-1",
    category: "Завършени обекти",
    icon: "🏠",
    title: "Преди → След",
    image: null,
    tone: "stone" as const,
    placeholder: "Място за сравнение",
  },
  {
    id: "produce-2",
    category: "Продукция",
    icon: "🍅",
    title: "Рангел с реколтата",
    image: "/images/garden/rangel-tomatoes.webp",
    tone: "sun" as const,
    placeholder: "Снимка на продукцията",
  },
] as const;

export const navigation = [
  { label: "Начало", href: "#nachalo" },
  { label: "Нашата продукция", href: "#produktsiya" },
  { label: "За нас", href: "#za-nas" },
  { label: "Ремонти", href: "#remonti" },
  { label: "Галерия", href: "#galeriya" },
  { label: "Контакти", href: "#kontakti" },
] as const;

export const statusLabels: Record<
  ProductStatus,
  { label: string; symbol: string }
> = {
  available: { label: "В наличност", symbol: "●" },
  soon: { label: "Очакваме скоро", symbol: "●" },
  finished: { label: "Сезонът приключи", symbol: "●" },
};
