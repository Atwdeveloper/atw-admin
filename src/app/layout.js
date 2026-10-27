import Script from "next/script";
import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Anytime Work Admin",
  description: "Anytime Work admin panel",
  icons: { icon: "/favicon.ico" },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Applies the saved theme before first paint so there's no flash of the wrong theme.
const themeScript = `(function () {
  try {
    var saved = localStorage.getItem("theme-preference");
    if (saved === "dark" || (!saved && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }) {
  return (
    // The theme script changes <html>'s class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
