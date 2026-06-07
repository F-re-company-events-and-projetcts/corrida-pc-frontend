import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2ª Corrida do Policial Civil",
  description: "Desafie seus limites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
