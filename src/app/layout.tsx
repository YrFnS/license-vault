import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LicenseVault - Contractor License Compliance Management",
  description: "Track contractor licenses, permits, and certifications across your entire organization. Get alerts before they expire.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
