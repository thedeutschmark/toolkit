import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://toolkit.deutschmark.online"),
  title: "DM Toolkit",
  description: "Creator infrastructure for widgets, connections, and broadcast setup.",
  alternates: {
    canonical: "https://toolkit.deutschmark.online",
  },
  openGraph: {
    type: "website",
    url: "https://toolkit.deutschmark.online",
    siteName: "DM Toolkit",
    title: "DM Toolkit",
    description: "Creator infrastructure for widgets, connections, and broadcast setup.",
    // og:image — Discord/Slack/WhatsApp use the SVG. For Twitter's large card format,
    // export og.svg to og.png (1200×630) and place it in public/ alongside og.svg.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "deutschmark toolkit — Creator infrastructure for widgets, connections, and broadcast setup.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DM Toolkit",
    description: "Creator infrastructure for widgets, connections, and broadcast setup.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
