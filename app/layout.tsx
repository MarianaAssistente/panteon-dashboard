import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
// ChatWidget removido — chat integrado na página /comunicacao

export const metadata: Metadata = {
  title: "Panteão do Olimpo — STM Group",
  description: "Dashboard de gestão do Panteão do Olimpo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
        {/* ChatWidget removido */}
        <Sidebar />
        <main className="md:ml-64 min-h-screen p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
