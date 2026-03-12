import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";

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
        <ChatWidget />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
