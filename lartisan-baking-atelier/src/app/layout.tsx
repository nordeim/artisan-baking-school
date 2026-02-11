import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(42, 15%, 94%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(42, 15%, 94%)" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "L'Artisan Baking Atelier | Master the Art of Baking",
    template: "%s | L'Artisan Baking Atelier",
  },
  description:
    "Singapore's premier luxury baking academy. Master artisanal baking with world-class instructors. From sourdough to pâtisserie - transform your passion into mastery.",
  keywords: [
    "baking classes",
    "sourdough",
    "pastry",
    "Singapore",
    "baking school",
    "artisan bread",
    "viennoserie",
    "culinary education",
  ],
  authors: [{ name: "L'Artisan Baking Atelier" }],
  creator: "L'Artisan Baking Atelier",
  publisher: "L'Artisan Baking Atelier",
  metadataBase: new URL("https://lartisan.sg"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_SG",
    url: "https://lartisan.sg",
    siteName: "L'Artisan Baking Atelier",
    title: "L'Artisan Baking Atelier | Master the Art of Baking",
    description:
      "Singapore's premier luxury baking academy. Master artisanal baking with world-class instructors.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "L'Artisan Baking Atelier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "L'Artisan Baking Atelier | Master the Art of Baking",
    description:
      "Singapore's premier luxury baking academy. Master artisanal baking with world-class instructors.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-verification-code",
  },
  category: "Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bone font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
