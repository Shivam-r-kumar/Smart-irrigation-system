import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "AgriSmart — Smart Irrigation & Precision Farming";
  const description = "Monitor soil, control irrigation, reduce water use and choose better crops from one intelligent farm dashboard.";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/og.png`, width: 1734, height: 908, alt: "AgriSmart smart irrigation across a healthy farm" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
