import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operation Dhurandhar — IB Needs You",
  description:
    "Decrypt the transmission. Recruit your squad. The mission begins now. Dhurandhar 2 — In Cinemas March 19.",
  openGraph: {
    title: "Operation Dhurandhar — IB Needs You",
    description: "Decrypt the transmission. Recruit your squad.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-mono antialiased animate-flicker scanlines">
        {children}
      </body>
    </html>
  );
}
