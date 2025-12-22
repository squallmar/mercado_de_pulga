import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Mercado de Pulga - Marketplace de Segunda Mão",
  description:
    "Compre e venda produtos usados com segurança no maior marketplace brasileiro de segunda mão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <I18nProvider>
            <CurrencyProvider>
              <Navigation />
              {children}
            </CurrencyProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
