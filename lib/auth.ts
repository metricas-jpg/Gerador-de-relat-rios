import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Login com Google, igual ao Portal de Relatórios, mas restrito:
 * só entram e-mails dos domínios em ALLOWED_EMAIL_DOMAINS
 * ou listados em ALLOWED_EMAILS (separados por vírgula).
 */
function lista(v: string | undefined) {
  return (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function emailPermitido(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  const dominios = lista(process.env.ALLOWED_EMAIL_DOMAINS);
  const emails = lista(process.env.ALLOWED_EMAILS);
  if (!dominios.length && !emails.length) return false; // sem configuração, ninguém entra
  if (emails.includes(e)) return true;
  return dominios.some((d) => e.endsWith("@" + d.replace(/^@/, "")));
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const verificado = (profile as { email_verified?: boolean } | undefined)?.email_verified !== false;
      if (verificado && emailPermitido(user.email)) return true;
      return "/?erro=AcessoNegado";
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
