import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { PendoInitializer } from "@/components/PendoInitializer";
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
      <head>
        <Script id="pendo-install" strategy="afterInteractive">{`
(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track', 'trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('4f6dcc24-9e43-454a-b68d-80148439db73');
`}</Script>
      </head>
      <body className="h-full overflow-hidden">
        <PendoInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
