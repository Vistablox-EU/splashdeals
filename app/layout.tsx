import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#06b6d4",
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  return {
    metadataBase: new URL("https://www.splashdeals.rs"),
    title: {
      template: "%s | Splashdeals",
      default: "Splashdeals | Najbolji Akva Parkovi i Bazeni u Srbiji",
    },
    description:
      "Preskočite redove i uskočite u zabavu. Kupite digitalne karte za Petroland i druge najbolje akva parkove u Srbiji instant.",
    alternates: {
      canonical: `https://www.splashdeals.rs${pathname}`,
      languages: {
        "sr-RS": `https://www.splashdeals.rs${pathname}`,
        sr: `https://www.splashdeals.rs${pathname}`,
        "x-default": `https://www.splashdeals.rs${pathname}`,
      },
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className="dark scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://grainy-gradients.vercel.app" />
        <link
          rel="preconnect"
          href="https://f7t7eeiv4kcyjvws.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased selection:bg-cyan-500/20 bg-[#020617]`}
      >
        {children}
      </body>
    </html>
  );
}
