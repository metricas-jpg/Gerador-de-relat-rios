import { NextRequest, NextResponse } from "next/server";
import { salvarImagem } from "@/lib/drive";
import { usuarioAutorizado, naoAutorizado } from "@/lib/guard";

// A Vercel limita o corpo da requisição a ~4,5 MB; a página reduz imagens maiores antes de enviar.
const MAX = 4 * 1024 * 1024;
const TIPOS = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  const tipo = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!TIPOS.has(tipo)) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (buf.length > MAX) return NextResponse.json({ error: "too_large" }, { status: 413 });
  try {
    const id = await salvarImagem(buf, tipo);
    return NextResponse.json({ id, url: `/api/monitor/arquivos/${id}` });
  } catch (e) {
    console.error("Erro ao enviar imagem:", e);
    return NextResponse.json({ error: "Falha ao gravar no Drive" }, { status: 500 });
  }
}
