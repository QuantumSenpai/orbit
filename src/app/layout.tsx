import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OrbitProvider } from "@/context/OrbitContext";
import { AppShell } from "@/components/shell/AppShell";
import { ServiceWorkerRegistrar } from "@/components/shell/ServiceWorkerRegistrar";

const archivo = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Every workspace route is private and session-gated by `src/middleware.ts`.
 * Rendering them dynamically guarantees no workspace HTML is ever prerendered
 * into a publicly addressable artifact or CDN cache entry.
 * The manifest route opts back into static rendering via its own config.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ORBIT — Personal AI Workspace",
  description:
    "A calm, editorial personal workspace bringing daily tasks, projects, inbox captures, ideas, library references, opportunities, and CV versions into one place.",
  applicationName: "Orbit",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Orbit",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#282828",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body>
        <OrbitProvider>
          <AppShell>{children}</AppShell>
          <ServiceWorkerRegistrar />
        </OrbitProvider>
      </body>
    </html>
  );
}
