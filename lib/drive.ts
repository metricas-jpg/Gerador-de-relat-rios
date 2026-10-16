import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

/**
 * Armazenamento no Google Drive pela mesma Service Account do Portal de Relatórios.
 * - Cada relatório é um arquivo JSON na pasta DRIVE_FOLDER_ID.
 * - Prints e logos ficam em DRIVE_UPLOADS_FOLDER_ID (ou na mesma pasta, se não definida).
 * A pasta precisa estar num Drive compartilhado e a Service Account precisa ser
 * "Administrador de conteúdo" dela: Service Accounts não têm cota no Meu Drive.
 */

const APP = "monitor-crise";
const APP_UPLOAD = "monitor-crise-upload";

export function pastaRelatorios() {
  const id = process.env.DRIVE_FOLDER_ID;
  if (!id) throw new Error("DRIVE_FOLDER_ID não configurado");
  return id;
}
export function pastaUploads() {
  return process.env.DRIVE_UPLOADS_FOLDER_ID || pastaRelatorios();
}

let cache: drive_v3.Drive | null = null;
export function drive(): drive_v3.Drive {
  if (cache) return cache;
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Credenciais da Service Account ausentes");
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive"] });
  cache = google.drive({ version: "v3", auth });
  return cache;
}

const ALL = { supportsAllDrives: true, includeItemsFromAllDrives: true } as const;

/** appProperties do Drive aceitam no máximo 124 bytes por chave+valor. */
function corta(chave: string, valor: string) {
  const max = 124 - Buffer.byteLength(chave, "utf8");
  let v = String(valor || "");
  while (Buffer.byteLength(v, "utf8") > max) v = v.slice(0, -1);
  return v;
}

export type Resumo = {
  id: string; titulo: string; singular: string; edicao: string;
  atualizacao: string; updatedAt: string; clientId: string;
};
export type Documento = Omit<Resumo, "id"> & { data: Record<string, unknown> };

function props(rid: string, d: Omit<Resumo, "id">): Record<string, string> {
  const p: Record<string, string> = { app: APP, rid };
  (["titulo", "singular", "edicao", "atualizacao", "updatedAt", "clientId"] as const).forEach((k) => {
    p[k] = corta(k, d[k]);
  });
  return p;
}

function resumo(f: drive_v3.Schema$File): Resumo {
  const p = f.appProperties || {};
  return {
    id: p.rid || "", titulo: p.titulo || "", singular: p.singular || "", edicao: p.edicao || "",
    atualizacao: p.atualizacao || "", updatedAt: p.updatedAt || "", clientId: p.clientId || "",
  };
}

export async function listar(): Promise<Resumo[]> {
  const out: Resumo[] = [];
  let pageToken: string | undefined;
  do {
    const r = await drive().files.list({
      ...ALL,
      q: `'${pastaRelatorios()}' in parents and trashed = false and appProperties has { key='app' and value='${APP}' }`,
      fields: "nextPageToken, files(id, appProperties)",
      pageSize: 1000,
      pageToken,
    });
    (r.data.files || []).forEach((f) => out.push(resumo(f)));
    pageToken = r.data.nextPageToken || undefined;
  } while (pageToken);
  return out.filter((x) => x.id).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** rid já validado pelo chamador (apenas letras, números, _ e -). */
export async function acharArquivo(rid: string): Promise<drive_v3.Schema$File | null> {
  const r = await drive().files.list({
    ...ALL,
    q: `'${pastaRelatorios()}' in parents and trashed = false and appProperties has { key='app' and value='${APP}' } and appProperties has { key='rid' and value='${rid}' }`,
    fields: "files(id, appProperties)",
    pageSize: 2,
  });
  return (r.data.files || [])[0] || null;
}

export async function ler(fileId: string): Promise<Documento> {
  const r = await drive().files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "text" });
  return JSON.parse(String(r.data));
}

export async function gravar(rid: string, doc: Documento, fileId?: string | null) {
  const body = JSON.stringify(doc);
  const media = { mimeType: "application/json", body: Readable.from([body]) };
  const appProperties = props(rid, doc);
  if (fileId) {
    await drive().files.update({ fileId, supportsAllDrives: true, requestBody: { appProperties }, media });
  } else {
    await drive().files.create({
      supportsAllDrives: true,
      requestBody: { name: `relatorio-${rid}.json`, parents: [pastaRelatorios()], mimeType: "application/json", appProperties },
      media,
      fields: "id",
    });
  }
}

export async function lixeira(fileId: string) {
  await drive().files.update({ fileId, supportsAllDrives: true, requestBody: { trashed: true } });
}

export async function salvarImagem(buf: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split("/")[1] || "img";
  const r = await drive().files.create({
    supportsAllDrives: true,
    requestBody: {
      name: `print-${Date.now()}.${ext}`,
      parents: [pastaUploads()],
      mimeType,
      appProperties: { app: APP_UPLOAD },
    },
    media: { mimeType, body: Readable.from([buf]) },
    fields: "id",
  });
  if (!r.data.id) throw new Error("Drive não devolveu id");
  return r.data.id;
}

/** Só devolve imagens enviadas por este sistema, nunca outros arquivos que a Service Account enxerga. */
export async function lerImagem(fileId: string): Promise<{ buf: Buffer; mimeType: string } | null> {
  const meta = await drive().files.get({ fileId, supportsAllDrives: true, fields: "mimeType, appProperties, trashed" });
  if (meta.data.trashed || meta.data.appProperties?.app !== APP_UPLOAD) return null;
  const r = await drive().files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
  return { buf: Buffer.from(r.data as ArrayBuffer), mimeType: meta.data.mimeType || "image/jpeg" };
}
