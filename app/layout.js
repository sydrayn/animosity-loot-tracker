import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Animosity — Raid Loot Council Tracker",
  description: "Guild loot distribution, tier tokens, and upgrade analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script id="wowhead-config" strategy="beforeInteractive">
          {`var whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: false };`}
        </Script>
        <Script
          src="https://wow.zamimg.com/js/tooltips.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}