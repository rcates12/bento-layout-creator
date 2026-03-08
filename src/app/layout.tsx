import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lintel — Visual Bento Layout Builder",
  description:
    "Visual bento layout builder — craft grid layouts and export clean Tailwind HTML, standalone HTML, or React JSX. No sign-up required.",
  metadataBase: new URL("https://lintel.design"),
  openGraph: {
    title: "Lintel — Visual Bento Layout Builder",
    description:
      "Visual bento layout builder — craft grid layouts and export clean Tailwind HTML, standalone HTML, or React JSX. No sign-up required.",
    url: "https://lintel.design",
    siteName: "Lintel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lintel — Visual Bento Layout Builder",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lintel — Visual Bento Layout Builder",
    description:
      "Visual bento layout builder — craft grid layouts and export clean Tailwind HTML, standalone HTML, or React JSX. No sign-up required.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://lintel.design",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${notoSerifDisplay.variable} dark`}>
      <body className="h-full overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
