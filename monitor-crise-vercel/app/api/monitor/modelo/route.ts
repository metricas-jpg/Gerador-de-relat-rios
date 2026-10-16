import { NextResponse } from "next/server";
import modelo from "@/lib/modelo-apex.json";
import { usuarioAutorizado, naoAutorizado } from "@/lib/guard";

/** Modelo preenchido (caso Apex Partners) para começar um relatório de exemplo. */
export async function GET() {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  return NextResponse.json(modelo, { headers: { "Cache-Control": "no-store" } });
}
