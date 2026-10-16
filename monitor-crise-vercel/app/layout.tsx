import type { Metadata } from "next";
import { Arimo, Source_Sans_3 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Fonte da interface
const ui = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap", variable: "--font-ui" });
// Fonte do relatório (métrica igual à Arial do modelo original)
const doc = Arimo({ subsets: ["latin"], weight: ["400", "600", "700"], style: ["normal", "italic"], display: "swap", variable: "--font-doc" });

export const metadata: Metadata = {
  title: "Monitor de Crise | Sicoob & Loggia",
  description: "Preenchimento e geração do relatório de monitoramento de crise",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ui.variable} ${doc.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
