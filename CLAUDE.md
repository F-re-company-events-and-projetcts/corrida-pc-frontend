# CLAUDE.md — Corrida do Policial Civil

## Contexto do Projeto

Plataforma de inscrições para a 2ª Corrida do Policial Civil (27/Set/2026, Coxim-MS).
Monorepo com frontend (landing page + fluxo de inscrição), backend (API + webhooks) e painel admin.

**Documento de referência:** `PRD-v2-Corrida-Policial-Civil.md` na raiz.
**Stories pendentes:** `prd.json` na raiz — execute sempre por ID (US-014, US-015...).

---

## Estado Atual — Fase 1 concluída (US-001 a US-013)

| Story | Status | O que foi feito |
|---|---|---|
| US-001 | ✅ | Monorepo pnpm workspaces + Turborepo |
| US-002 | ✅ | Correções frontend: 8KM→10KM, preços dinâmicos, routing /inscricao |
| US-003 | ✅ | Schema Prisma completo, client singleton, seed (4 cats + 2 lotes), migration no Neon |
| US-004 | ✅ | `InscricaoSchema`, `CriarPedidoSchema`, `validarCPF` com dígito verificador |
| US-005 | ✅ | `GET /api/v1/categorias` — preço dinâmico, vagasDisponiveis, Cache-Control 30s |
| US-006 | ✅ | Landing page consome API, PricingCard dinâmico, badge "Esgotado" |
| US-007 | ✅ | `/inscricao` Step 1, `InscricaoContext`, `StepProgressBar` (5 steps via pathname) |
| US-008 | ✅ | `/inscricao/dados` Step 2, react-hook-form + Zod, CPF em tempo real, dedup, máx 5 |
| US-009 | ✅ | `/inscricao/revisao` Step 3, seletor PIX/Cartão, checkboxes regulamento + policial |
| US-010 | ✅ | `POST /api/v1/inscricao` — rate limiting, vagas, PIX via MP, PedidoRascunho |
| US-011 | ✅ | `/inscricao/pagamento` PIX — QR code base64, countdown colorido, polling 3s, cleanup |
| US-012 | ✅ | Cartão — CardPaymentStep iframes, `POST /inscricao/[id]/cartao`, transação atômica |
| US-013 | ✅ | Webhook MP — HMAC-SHA256 x-signature, idempotência, persiste participantes PIX |

### Próximas stories (prd.json)
- **US-014** — `/inscricao/confirmacao` (tela pós-pagamento, limpar contexto, pedidoId no context)
- **US-015** — `/pedido/[id]` (status público sem login)
- **US-016** — E-mail de confirmação (packages/email + Resend)
- **US-017** ✅ — Worker expiração PIX (Vercel Cron a cada 15min) — endpoint + vercel.json
- **US-018** ✅ — Autenticação admin: `POST /api/v1/admin/auth`, middleware JWT (jose), login page, cookie httpOnly, seed-admin.ts
- **US-019 a US-023** — Painel admin + check-in + importação planilha

### Banco de Dados
- Neon PostgreSQL — connection string em `.env.local` (DATABASE_URL)
- **packages/db/.env** deve ter DATABASE_URL (necessário para `prisma migrate`)
- Migrations aplicadas: `20260416000000_init`, `20260421000000_add_pedido_rascunho`
- Seed: rodar dentro de `packages/db/` com `npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts`

---

## Estrutura do Monorepo

```
corrida-pc-frontend/
├── apps/
│   ├── web/          ← Next.js 14 — landing page + fluxo /inscricao (porta 3000)
│   ├── api/          ← Next.js 14 — REST API + webhooks MP (porta 3001)
│   └── admin/        ← Next.js 14 — painel admin + check-in (porta 3002, não iniciado)
├── packages/
│   ├── db/           ← Prisma schema + migrations + client singleton
│   ├── types/        ← interfaces TypeScript compartilhadas
│   ├── validations/  ← schemas Zod (InscricaoSchema, CriarPedidoSchema, validarCPF)
│   └── email/        ← vazio — implementar na US-016 com React Email + Resend
├── PRD-v2-Corrida-Policial-Civil.md
├── prd.json          ← 23 user stories
└── CLAUDE.md         ← este arquivo
```

---

## Convenções de Import — CRÍTICO

```typescript
// ✅ Correto
import { prisma } from "@corrida/db"
import { Participante, StatusPedido } from "@corrida/db"   // tipos gerados pelo Prisma
import type { Categoria } from "@corrida/types"             // interfaces manuais
import { InscricaoSchema, validarCPF } from "@corrida/validations"

// ❌ Nunca
import { PrismaClient } from "@prisma/client"  // nunca instancie direto
import { Categoria } from "../../types"         // nunca importe entre apps com path relativo
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 App Router |
| Backend | Next.js 14 API Routes |
| ORM | Prisma v6 |
| Banco | PostgreSQL via Neon |
| Pagamentos | Mercado Pago SDK v2 (`mercadopago@^2`) |
| E-mail | Resend + React Email (US-016) |
| Estilo | Tailwind CSS v4 |
| Validação | Zod v3 |
| Forms | react-hook-form + @hookform/resolvers |
| Monorepo | pnpm workspaces + Turborepo |

---

## Regras de Desenvolvimento

### SEMPRE
- TypeScript estrito — `strict: true` em todos os tsconfigs
- Usar tipos de `@corrida/types` — nunca redefinir localmente
- Validar com Zod de `@corrida/validations` — nunca ad-hoc
- Importar Prisma de `@corrida/db` — nunca instanciar `PrismaClient` dentro de um app
- Rodar `pnpm --filter @corrida/[app] typecheck` ao finalizar cada story
- Toda alteração de schema Prisma → migration correspondente

### NUNCA
- Nunca armazenar CPF em plain text — sempre `bcrypt.hash(cpf.replace(/\D/g, ''), 10)`
- Nunca armazenar dados de cartão (número, CVV) em banco ou logs
- Nunca processar webhook sem validar `x-signature` HMAC-SHA256 primeiro
- Nunca hardcode preços ou vagas no frontend — sempre da API
- Nunca commitar `.env` ou `.env.local`

---

## Regras de Negócio Críticas

### Preço
```
POLICIAL → R$ 80,00 FIXO em todos os lotes, sem exceção
CIDADÃO  → precoCidadao do lote ativo (1º: R$80 | 2º: R$85 | 3º: R$90)
           → null se nenhum lote ativo
```

### Vagas
- 150 por categoria (600 total)
- Verificar disponibilidade ANTES de criar pedido
- Incrementar `vagasOcupadas` DENTRO da transação de confirmação
- Considerar múltiplos inscritos na mesma categoria no mesmo pedido

### Fluxo PIX — dados só persistem após webhook
```
POST /inscricao → Pedido (AGUARDANDO_PAGAMENTO) + PedidoRascunho (JSON dos inscritos)
Webhook confirmado → Participantes + Pagamento + Pedido(PAGO) → deleta PedidoRascunho
```

### Fluxo Cartão — dados persistem na hora
```
POST /inscricao → Pedido (AGUARDANDO_PAGAMENTO), retorna { pedidoId, total }
POST /inscricao/[id]/cartao → token MP → Participantes + Pagamento + Pedido(PAGO)
```

### Webhook — manifest exato para HMAC-SHA256
```typescript
// Ordem e ponto-e-vírgula finais são obrigatórios
const ts = xSignature.split(',')[0].split('=')[1]
const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
```

---

## Modelo de Dados

```prisma
model Categoria {
  id            String         @id @default(cuid())
  nome          String
  percursoKm    Int
  tipo          TipoCategoria  // CIDADAO | POLICIAL
  vagasTotal    Int            @default(150)
  vagasOcupadas Int            @default(0)
  participantes Participante[]
  createdAt     DateTime       @default(now())
}

model Lote {
  id           String   @id @default(cuid())
  nome         String
  precoCidadao Float
  ativo        Boolean  @default(false)
  dataInicio   DateTime
  dataFim      DateTime
  createdAt    DateTime @default(now())
}

model Pedido {
  id              String          @id @default(cuid())
  total           Float
  status          StatusPedido    @default(AGUARDANDO_PAGAMENTO)
  metodoPagamento MetodoPagamento
  paymentId       String?         @unique
  expiresAt       DateTime?
  participantes   Participante[]
  pagamento       Pagamento?
  rascunho        PedidoRascunho?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model PedidoRascunho {
  id             String   @id @default(cuid())
  pedidoId       String   @unique
  pedido         Pedido   @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  inscricoesJson String   // JSON.stringify(InscricaoInput[])
  expiresAt      DateTime
  createdAt      DateTime @default(now())
}

model Participante {
  id                 String          @id @default(cuid())
  nome               String
  cpf                String          // bcrypt hash — NUNCA plain text
  dataNascimento     DateTime
  telefone           String
  email              String
  contatoEmergencia  String
  tamanhoCamiseta    TamanhoCamiseta
  categoriaId        String
  categoria          Categoria       @relation(fields: [categoriaId], references: [id])
  pedidoId           String
  pedido             Pedido          @relation(fields: [pedidoId], references: [id])
  numeroPeito        Int?
  checkinRealizadoEm DateTime?
  createdAt          DateTime        @default(now())

  @@index([cpf])
  @@index([email])
  @@index([categoriaId])
}

model Pagamento {
  id                String          @id @default(cuid())
  pedidoId          String          @unique
  pedido            Pedido          @relation(fields: [pedidoId], references: [id])
  paymentIdGateway  String          @unique
  valor             Float
  metodo            MetodoPagamento
  status            String
  webhookRecebidoEm DateTime?
  createdAt         DateTime        @default(now())
}

model AdminUser {
  id        String     @id @default(cuid())
  email     String     @unique
  senha     String     // bcrypt hash
  nome      String
  role      AdminRole  @default(OPERACIONAL)
  logs      AdminLog[]
  createdAt DateTime   @default(now())
}

model AdminLog {
  id            String    @id @default(cuid())
  adminId       String
  admin         AdminUser @relation(fields: [adminId], references: [id])
  acao          String
  entidade      String
  entidadeId    String
  valorAnterior String?
  valorNovo     String?
  createdAt     DateTime  @default(now())
}

enum TipoCategoria   { CIDADAO POLICIAL }
enum StatusPedido    { AGUARDANDO_PAGAMENTO PAGO RECUSADO EXPIRADO CANCELADO }
enum MetodoPagamento { PIX CARTAO }
enum TamanhoCamiseta { PP P M G GG XGG }
enum AdminRole       { TOTAL OPERACIONAL }
```

---

## Rotas Implementadas

### apps/api (porta 3001)
```
GET  /api/v1/categorias                ← lista com preços e vagas
POST /api/v1/inscricao                 ← cria pedido (PIX: + rascunho | Cartão: só pedido)
GET  /api/v1/inscricao/[id]            ← status do pedido
POST /api/v1/inscricao/[id]/cartao     ← processa token, persiste participantes
POST /api/v1/webhook/mercadopago       ← confirma PIX, persiste participantes
POST /api/v1/admin/auth                ← login admin → JWT (rate limit: 5/15min/IP)
```

### apps/admin (porta 3002)
```
/login                     ← formulário email+senha (react-hook-form + Zod)
/dashboard                 ← protegido por middleware JWT
/logout                    ← limpa cookie admin_token e redireciona para /login
/api/auth/session          ← POST interno: recebe token, define cookie httpOnly
```
middleware.ts protege todas as rotas exceto /login e /api/auth/session.
Cookie: admin_token (httpOnly, sameSite: strict, maxAge: 8h).

### apps/web (porta 3000)
```
/                          ← landing page (server component)
/inscricao                 ← Step 1: seleção de categoria
/inscricao/dados           ← Step 2: formulário
/inscricao/revisao         ← Step 3: revisão + pagamento
/inscricao/pagamento       ← Step 4: PIX ou Cartão
/inscricao/confirmacao     ← Step 5: confirmação (US-014 — pendente)
/pedido/[id]               ← status público (US-015 — pendente)
```

---

## InscricaoContext

```typescript
// src/contexts/InscricaoContext.tsx — state atual
interface InscricaoState {
  categoriaId: string | null
  setCategoriaId: (id: string | null) => void
  inscricoes: InscricaoInput[]
  setInscricoes: (inscritos: InscricaoInput[]) => void
  metodoPagamento: 'PIX' | 'CARTAO' | null
  setMetodoPagamento: (m: 'PIX' | 'CARTAO') => void
  // US-014: adicionar pedidoId: string | null e setPedidoId
}
// Provider envolve src/app/inscricao/layout.tsx
```

---

## Variáveis de Ambiente

```bash
DATABASE_URL=""                      # Neon PostgreSQL
MP_ACCESS_TOKEN="TEST-..."           # TEST- em dev, APP_USR- em produção
MP_PUBLIC_KEY="TEST-..."             # não usar em server-side
MP_WEBHOOK_SECRET=""                 # configurar ao registrar webhook no MP
NEXT_PUBLIC_MP_PUBLIC_KEY="TEST-..."  # exposto ao browser
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
RESEND_API_KEY=""                    # US-016
EMAIL_FROM=""                        # US-016
CRON_SECRET=""                       # US-017 — protege /api/v1/cron/expirar-pix
ADMIN_JWT_SECRET=""                  # US-018 — assina e verifica JWT do painel admin (HS256, 8h)
```

> ⚠️ `packages/db/.env` também deve ter `DATABASE_URL` para o Prisma CLI funcionar.
> ⚠️ `NEXT_PUBLIC_MP_PUBLIC_KEY` ≠ `MP_ACCESS_TOKEN` — são chaves completamente diferentes.

---

## Padrões de Implementação

### Server component buscando dados (padrão Next.js 14)
```typescript
export default async function Page() {
  const categorias = await fetchCategorias()  // fetch no servidor
  return <ClientComponent categorias={categorias} />  // passa para client
}
```

### Estado discriminado para páginas com múltiplos estados
```typescript
type PageState =
  | { kind: 'loading' }
  | { kind: 'pix'; data: PedidoData }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }
```

### Transação atômica com vagas (padrão usado em US-012 e US-013)
```typescript
await prisma.$transaction(async (tx) => {
  // 1. criar participantes com CPF hasheado
  for (const [idx, inscricao] of inscricoes.entries()) {
    await tx.participante.create({ data: { ...inscricao, cpf: cpfHashes[idx] } })
  }
  // 2. registrar pagamento
  await tx.pagamento.create({ data: { pedidoId, paymentIdGateway, ... } })
  // 3. atualizar status do pedido
  await tx.pedido.update({ where: { id: pedidoId }, data: { status: 'PAGO' } })
  // 4. incrementar vagas por categoria
  for (const [categoriaId, count] of Object.entries(countPerCategory)) {
    await tx.categoria.update({ where: { id: categoriaId }, data: { vagasOcupadas: { increment: count } } })
  }
  // 5. limpar rascunho (apenas PIX)
  await tx.pedidoRascunho.delete({ where: { pedidoId } })
})
```

---

## Scripts

```bash
pnpm dev                    # todos os apps em paralelo via Turborepo
pnpm typecheck              # todos os apps
pnpm --filter @corrida/web typecheck   # só o web
pnpm --filter @corrida/api typecheck   # só a api
pnpm db:migrate             # nova migration (pede nome interativamente)
pnpm db:generate            # regenerar Prisma client
pnpm db:studio              # Prisma Studio na porta 5555
```

---

## Checklist de Segurança (revisar antes de cada PR)

- [ ] CPF armazenado como bcrypt hash — nunca plain text
- [ ] Nenhum dado de cartão em logs ou banco
- [ ] Webhook valida `x-signature` antes de processar
- [ ] Rate limiting ativo em `/api/v1/inscricao` (10 req/min/IP)
- [ ] Idempotência: verificar `paymentIdGateway` antes de persistir
- [ ] `.env` e `.env.local` não commitados
- [ ] `NEXT_PUBLIC_MP_PUBLIC_KEY` ≠ `MP_ACCESS_TOKEN`
