import type { Metadata, Viewport } from "next";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
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
      <body>
        <DesktopSidebar />
        <div className="min-h-screen lg:pl-[264px]">
          <main className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-12 lg:pt-8 xl:px-12">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
