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
    "32年の臨床経験を持つ鍼灸師が監修。あなたの命式から、養生の方針をAIが導きます。占いではなく、明日からの実践マニュアル。ゆかわ鍼灸マッサージ治療院（札幌）。",
  openGraph: {
    title: "経絡命式 ― 鍼灸師監修 AI 養生鑑定",
    description:
      "鍼灸師の臨床32年から書く、あなただけの100ページの養生鑑定書。占いではなく、明日からの実践マニュアル。",
    url: "https://keiraku.yukawa-care.net/",
    siteName: "経絡命式 養生鑑定",
    locale: "ja_JP",
    type: "website",
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
