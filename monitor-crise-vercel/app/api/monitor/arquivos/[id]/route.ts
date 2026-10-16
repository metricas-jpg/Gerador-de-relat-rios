import { NextRequest, NextResponse } from "next/server";
import { lerImagem } from "@/lib/drive";
import { usuarioAutorizado, naoAutorizado } from "@/lib/guard";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/monitor/arquivos/[id]">) {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const img = await lerImagem(id);
    if (!img) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return new NextResponse(new Uint8Array(img.buf), {
      headers: {
        "Content-Type": img.mimeType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("Erro ao ler imagem:", e);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
