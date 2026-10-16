import { NextRequest, NextResponse } from "next/server";
import { acharArquivo, gravar, ler, lixeira } from "@/lib/drive";
import { usuarioAutorizado, naoAutorizado, ID_RE } from "@/lib/guard";

type Ctx = RouteContext<"/api/monitor/relatorios/[id]">;

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const f = await acharArquivo(id);
    if (!f?.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(await ler(f.id), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Erro ao abrir relatório:", e);
    return NextResponse.json({ error: "Falha ao consultar o Drive" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const email = await usuarioAutorizado();
  if (!email) return naoAutorizado();
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: {
    data?: unknown; titulo?: string; singular?: string; edicao?: string; atualizacao?: string;
    clientId?: string; baseUpdatedAt?: string | null; force?: boolean;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body.data !== "object" || body.data === null) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const f = await acharArquivo(id);
    const atual = f?.appProperties || null;
    // Proteção contra sobrescrever o trabalho de outra pessoa
    if (atual && !body.force && atual.updatedAt !== body.baseUpdatedAt && atual.clientId !== body.clientId) {
      return NextResponse.json({ error: "conflict", updatedAt: atual.updatedAt }, { status: 409 });
    }
    const doc = {
      data: body.data as Record<string, unknown>,
      titulo: String(body.titulo || ""), singular: String(body.singular || ""),
      edicao: String(body.edicao || ""), atualizacao: String(body.atualizacao || ""),
      clientId: String(body.clientId || ""),
      updatedAt: new Date().toISOString(),
      updatedBy: email,
    };
    await gravar(id, doc, f?.id);
    return NextResponse.json({ updatedAt: doc.updatedAt });
  } catch (e) {
    console.error("Erro ao salvar relatório:", e);
    return NextResponse.json({ error: "Falha ao gravar no Drive" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await usuarioAutorizado())) return naoAutorizado();
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const f = await acharArquivo(id);
    if (f?.id) await lixeira(f.id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("Erro ao apagar relatório:", e);
    return NextResponse.json({ error: "Falha ao apagar no Drive" }, { status: 500 });
  }
}
