# Monitor de Crise · Sicoob & Loggia

Formulário compartilhado para preencher o relatório de monitoramento de crise, com prévia no layout oficial e download em PDF.

Mesma arquitetura do [Portal de Relatórios](https://github.com/metricas-jpg/portal-relatorios):

| Camada | Como funciona |
|---|---|
| Hospedagem | Next.js 16 na Vercel |
| Login | Google via NextAuth, restrito aos domínios/e-mails liberados |
| Dados | Google Drive, pela mesma Service Account do portal. Cada relatório é um arquivo JSON numa pasta; os prints ficam como imagens. |

## Estrutura

```
app/
  page.tsx                         tela de login e, depois, o monitor
  monitor.tsx                      monta a tela e carrega public/monitor-app.js
  monitor-markup.ts                estrutura HTML da tela
  globals.css                      estilos da interface e do relatório A4
  api/auth/[...nextauth]/route.ts  login Google
  api/monitor/relatorios/          listar, abrir, salvar e apagar relatórios
  api/monitor/uploads/             enviar prints e logo
  api/monitor/arquivos/[id]/       servir as imagens (só para quem está logado)
  api/monitor/modelo/              modelo preenchido do caso Apex
lib/
  auth.ts    regras de login (domínios e e-mails permitidos)
  drive.ts   leitura e gravação no Google Drive
  guard.ts   verificação de sessão nas rotas
public/
  monitor-app.js   formulário, prévia, pendências e geração do PDF
```

## Configuração na Vercel

### 1. Pasta no Google Drive

1. Crie uma pasta num **Drive compartilhado** (por exemplo, `Monitor de Crise · Relatórios`). Service Accounts não têm cota no "Meu Drive", então a pasta precisa estar num Drive compartilhado.
2. Adicione o e-mail da Service Account como **Administrador de conteúdo** desse Drive compartilhado (ou da pasta).
3. Copie o ID da pasta (o trecho depois de `/folders/` na URL). Opcional: crie uma subpasta só para os prints e copie o ID dela também.

### 2. Login Google

Pode usar o mesmo cliente OAuth do portal. No Google Cloud Console, em **APIs e serviços → Credenciais**, abra o cliente e adicione:

- Origem JavaScript autorizada: `https://SEU-DOMINIO`
- URI de redirecionamento: `https://SEU-DOMINIO/api/auth/callback/google`

### 3. Variáveis de ambiente

Cadastre em **Vercel → Project → Settings → Environment Variables** (modelo em `.env.example`):

| Variável | Obrigatória | Observação |
|---|---|---|
| `NEXTAUTH_URL` | sim | URL pública do app |
| `NEXTAUTH_SECRET` | sim | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | sim | Cliente OAuth |
| `ALLOWED_EMAIL_DOMAINS` | sim* | Ex.: `loggia.com.br,sicoob.com.br` |
| `ALLOWED_EMAILS` | sim* | E-mails avulsos, separados por vírgula |
| `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` | sim | Service Account |
| `DRIVE_FOLDER_ID` | sim | Pasta dos relatórios |
| `DRIVE_UPLOADS_FOLDER_ID` | não | Pasta dos prints (padrão: a mesma) |

\* Pelo menos uma das duas. Sem nenhuma, ninguém consegue entrar.

### 4. Deploy

Importe o repositório na Vercel (framework detectado: Next.js) e faça o deploy. Não há banco de dados nem outro serviço para configurar.

## Rodar localmente

```bash
cp .env.example .env.local   # preencha as variáveis
npm install
npm run dev
```

Para o login funcionar em `http://localhost:3000`, adicione também `http://localhost:3000/api/auth/callback/google` no cliente OAuth.

## Como o time usa

- **Novo relatório** começa em branco. Com a pasta vazia, a tela inicial também oferece **Começar pelo modelo da Apex**.
- **Nova edição a partir desta** copia o relatório aberto, soma 1 ao número da edição e limpa o que é próprio de cada edição ("O que mudou", novas menções, acionamentos e anexos).
- O salvamento é automático, a cada alteração. Se duas pessoas salvarem o mesmo relatório, a segunda vê um aviso para carregar a versão nova ou manter a sua.
- O contador de **pendências** no topo lista os campos vazios; no PDF eles saem como `[__]`.
- **Baixar PDF** gera o arquivo no navegador de quem clicou.

## Limites conhecidos

- **Tamanho dos prints.** A Vercel aceita no máximo 4,5 MB por requisição. A página reduz automaticamente imagens maiores antes do envio.
- **PDF como imagem.** Cada página do PDF é uma imagem: o texto não é selecionável nem pesquisável.
- **Bibliotecas externas.** html2canvas 1.4.1 e jsPDF 2.5.1 são carregados do cdnjs no navegador. Se a rede bloquear o cdnjs, o botão de PDF falha.
- **Apagar relatório.** Não há botão na tela. Para apagar, mova o arquivo `relatorio-<id>.json` para a lixeira no Drive.
