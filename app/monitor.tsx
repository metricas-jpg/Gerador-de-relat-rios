"use client";

import { useEffect } from "react";
import Script from "next/script";
import { signOut } from "next-auth/react";
import { MARKUP } from "./monitor-markup";

declare global {
  interface Window {
    __monitorUser?: string;
    __monitorSignOut?: () => void;
    __monitorLoaded?: boolean;
  }
}

/**
 * Monta a tela do monitor e carrega public/monitor-app.js, que cuida do formulário,
 * da prévia, do salvamento e do PDF.
 */
export default function Monitor({ email }: { email: string }) {
  useEffect(() => {
    window.__monitorUser = email;
    window.__monitorSignOut = () => signOut({ callbackUrl: "/" });
    if (window.__monitorLoaded) return; // evita carregar duas vezes em modo de desenvolvimento
    window.__monitorLoaded = true;
    const s = document.createElement("script");
    s.src = "/monitor-app.js";
    s.async = false;
    document.body.appendChild(s);
  }, [email]);

  return (
    <>
      {/* Bibliotecas usadas só na hora de gerar o PDF */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
