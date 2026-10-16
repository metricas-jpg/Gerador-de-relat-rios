import { NextResponse } from "next/server";
import { listar } from "@/lib/drive";
import { usuarioAutorizado, naoAutorizado } from "@/lib/guard";

export async function GET() {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  try {
    return NextResponse.json(await listar(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Erro ao listar relatórios:", e);
    return NextResponse.json({ error: "Falha ao consultar o Drive" }, { status: 500 });
  }
}
