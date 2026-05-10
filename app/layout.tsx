import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.jgaos2026-gif.com'),
  title: "JGA Enterprise OS | Jay's Graphic Arts LLC",
  description:
    "Enterprise Operating System for Jay's Graphic Arts LLC — secure, compliant, and scalable business operations powered by 8 System Laws.",
  openGraph: {
    title: "JGA Enterprise OS | Jay's Graphic Arts LLC",
    description:
      "Enterprise Operating System for Jay's Graphic Arts LLC — secure, compliant, and scalable business operations powered by 8 System Laws.",
    url: 'https://www.jgaos2026-gif.com',
    siteName: 'JGA Enterprise OS',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.jgaos2026-gif.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}