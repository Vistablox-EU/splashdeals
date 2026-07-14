import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { alternates } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "optional",
});

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.splashdeals.rs"),
  title: {
    template: "%s | Splashdeals",
    default: "Splashdeals | Najbolji Akva Parkovi i Bazeni u Srbiji",
  },
  description:
    "Preskočite redove i uskočite u zabavu. Kupite digitalne karte za Petroland i druge najbolje akva parkove u Srbiji instant.",
  alternates: {
    canonical: "https://www.splashdeals.rs",
    languages: alternates("/"),
  },
  openGraph: {
    images: ["/og-image.png"],
    type: "website",
    siteName: "Splashdeals",
    locale: "sr_RS",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/logo.png", color: "#06b6d4" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Splashdeals",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Splashdeals" />
        <link rel="preconnect" href="https://grainy-gradients.vercel.app" />
        <link rel="preload" as="image" href="https://grainy-gradients.vercel.app/noise.svg" />
        <link
          rel="preconnect"
          href="https://f7t7eeiv4kcyjvws.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} selection:bg-primary/20 bg-background scroll-smooth antialiased`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
