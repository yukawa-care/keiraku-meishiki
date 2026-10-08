import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSerifJp = Noto_Serif_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif-jp",
});

export const metadata: Metadata = {
  title: "経絡命式 ― 鍼灸師監修 AI 養生鑑定",
  description:
    "長年の施術経験を持つ鍼灸師が監修。あなたの命式から、養生の方針をAIが導きます。占いではなく、明日からの実践マニュアル。文・湯川研一（札幌）。",
  openGraph: {
    title: "経絡命式 ― 鍼灸師監修 AI 養生鑑定",
    description:
      "鍼灸師監修のAIが読み解く、あなたの体質と養生の手引き。扱うのは健康と養生だけです。",
    url: "https://keiraku.yukawa-care.net/",
    siteName: "経絡命式 養生鑑定",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "https://keiraku.yukawa-care.net/ogp.png",
        width: 1200,
        height: 630,
        alt: "経絡命式　鍼灸師監修　養生のすすめ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "経絡命式 ― 鍼灸師監修 AI 養生鑑定",
    description:
      "鍼灸師監修のAIが読み解く、あなたの体質と養生の手引き。扱うのは健康と養生だけです。",
    images: ["https://keiraku.yukawa-care.net/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${notoSerifJp.variable} antialiased`}>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PQVGWC3E1Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PQVGWC3E1Y');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
