import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marathon Dashboard",
    template: "%s · Marathon Dashboard",
  },
  description: "Preparación personal para el Maratón de Guadalajara 2026.",
  applicationName: "Marathon Dashboard",
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
