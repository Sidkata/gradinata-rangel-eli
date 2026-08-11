import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gradinata-rangel-eli.pages.dev"),
  title: "Градината на Рангел и Ели | Старо Железаре",
  description:
    "Сезонни плодове, зеленчуци и разсад от Старо Железаре. Строително-ремонтни услуги от Рангел.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "Градината на Рангел и Ели",
    title: "Градината на Рангел и Ели | Старо Железаре",
    description:
      "Сезонни плодове, зеленчуци и разсад от Старо Железаре. Строително-ремонтни услуги от Рангел.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Градината на Рангел и Ели — домашна продукция и ремонти",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Градината на Рангел и Ели",
    description: "Домашна продукция и майсторски услуги от Старо Железаре.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#163b2b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "Store"],
              name: "Градината на Рангел и Ели",
              description:
                "Сезонни плодове, зеленчуци и разсад. Строително-ремонтни услуги от Рангел.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Старо Железаре",
                addressCountry: "BG",
              },
              areaServed: "Старо Железаре, България",
              telephone: ["+359899960149", "+359894646086"],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  name: "Рангел",
                  telephone: "+359899960149",
                  contactType: "ремонти и строителство",
                },
                {
                  "@type": "ContactPoint",
                  name: "Ели",
                  telephone: "+359894646086",
                  contactType: "продукция и наличности",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
