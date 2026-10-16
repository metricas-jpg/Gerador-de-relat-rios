import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, emailPermitido } from "./auth";

/** Devolve o e-mail do usuário logado e autorizado, ou null. */
export async function usuarioAutorizado(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  return emailPermitido(email) ? (email as string) : null;
}

export function naoAutorizado() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
