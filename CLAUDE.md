# CLAUDE.md — Corrida do Policial Civil

## Contexto do Projeto

Plataforma de inscrições para a 2ª Corrida do Policial Civil (27/Set/2026, Coxim-MS).
Monorepo com frontend (landing page + fluxo de inscrição), backend (API + webhooks) e painel admin.

**Documento de referência:** `docs/PRD-v2.md` — leia antes de qualquer tarefa de produto.

---

## Estrutura do Monorepo

```
corrida-policial-civil/
├── apps/
│   ├── web/          ← Next.js 14 — landing page + fluxo de inscrição (/inscricao)
│   ├── api/          ← Next.js 14 — API REST + webhooks Mercado Pago (Vercel Functions)
│   └── admin/        ← Next.js 14 — painel admin + módulo de check-in
├── packages/
│   ├── db/           ← Prisma schema + migrations + cliente compartilhado
│   ├── types/        ← tipos TypeScript compartilhados (Participante, Pedido, Categoria…)
│   ├── validations/  ← schemas Zod compartilhados entre apps
│   └── email/        ← templates React Email (confirmação, lembrete PIX)
├── docs/
│   └── PRD-v2.md
├── CLAUDE.md         ← este arquivo
├── turbo.json
├── pnpm-workspace.yaml
└── package.json      ← root (devDependencies: turbo, typescript, eslint)
```

---

## Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Já existe no repo; reaproveitamento máximo |
| Backend | Next.js 14 API Routes | Deploy unificado na Vercel; sem servidor separado |
| ORM | Prisma | Melhor DX com Next.js; type-safety nativo |
| Banco | PostgreSQL via Neon | Serverless; integração nativa Vercel; tier gratuito |
| Pagamentos | Mercado Pago SDK | Gateway definido pelo cliente |
| E-mail | Resend + React Email | DX superior; integração simples com Next.js |
| Estilo | Tailwind CSS + shadcn/ui | Já em uso no repo |
| Validação | Zod | Compartilhado front/back via packages/validations |
| Monorepo | pnpm workspaces + Turborepo | Cache de build; scripts coordenados |
| Deploy | Vercel (todos os apps) | Monorepo nativo; sem config extra |

---

## Regras de Desenvolvimento

### Sempre

- Escreva TypeScript estrito. `strict: true` no tsconfig de todos os apps.
- Use os tipos de `packages/types` — nunca redefina `Participante`, `Pedido`, `Categoria` localmente.
- Valide inputs com Zod de `packages/validations` — nunca valide ad-hoc.
- Importe o cliente Prisma de `packages/db` — nunca instancie um novo `PrismaClient` dentro de um app.
- Use os componentes de `apps/web/src/components/atoms/` e `molecules/` — não crie componentes duplicados.
- Nomeie rotas de API como `/api/v1/[recurso]` em `apps/api`.
- Toda alteração de schema Prisma deve ter uma migration correspondente (`prisma migrate dev`).

### Nunca

- Nunca armazene dados de cartão (CVV, número completo) em banco ou logs.
- Nunca processe pagamento sem validar a assinatura do webhook (`x-signature` do Mercado Pago).
- Nunca hardcode preços, categorias ou limites de vagas no frontend — sempre consuma da API.
- Nunca faça `console.log` de CPF, e-mail ou dados de pagamento.
- Nunca instancie `PrismaClient` fora de `packages/db/src/client.ts`.
- Nunca commite `.env` — use `.env.example` com chaves vazias.

---

## Variáveis de Ambiente

Defina em `.env.local` (desenvolvimento) e no painel da Vercel (produção).
Crie `.env.example` na raiz com todas as chaves listadas abaixo (valores vazios).

```bash
# Banco de dados
DATABASE_URL=""                        # Neon PostgreSQL connection string

# Mercado Pago
MP_ACCESS_TOKEN=""                     # Token da conta PJ do organizador
MP_WEBHOOK_SECRET=""                   # Secret para validar assinatura do webhook
MP_PUBLIC_KEY=""                       # Chave pública para o SDK no frontend

# E-mail
RESEND_API_KEY=""                      # API key do Resend
EMAIL_FROM=""                          # ex: inscricoes@corridadopolicialcivil.com.br

# App
NEXT_PUBLIC_APP_URL=""                 # ex: https://corridadopolicialcivil.com.br
NEXT_PUBLIC_MP_PUBLIC_KEY=""           # Mesma que MP_PUBLIC_KEY, exposta ao cliente
ADMIN_SECRET=""                        # Seed do primeiro usuário admin

# Vercel (preenchido automaticamente em produção)
VERCEL_URL=""
```

---

## Modelo de Dados (Prisma — packages/db/prisma/schema.prisma)

```prisma
model Categoria {
  id              String         @id @default(cuid())
  nome            String         // "4KM Cidadão", "4KM Policial", "10KM Cidadão", "10KM Policial"
  percursoKm      Int            // 4 ou 10
  tipo            TipoCategoria  // CIDADAO | POLICIAL
  vagasTotal      Int            @default(150)
  vagasOcupadas   Int            @default(0)
  participantes   Participante[]
  createdAt       DateTime       @default(now())
}

model Lote {
  id            String   @id @default(cuid())
  nome          String   // "1º Lote", "2º Lote"
  precoCidadao  Float    // 80.00, 85.00, 90.00
  // preço policial é sempre 80.00 — não depende do lote
  ativo         Boolean  @default(false)
  dataInicio    DateTime
  dataFim       DateTime
  createdAt     DateTime @default(now())
}

model Pedido {
  id              String        @id @default(cuid())
  total           Float
  status          StatusPedido  @default(AGUARDANDO_PAGAMENTO)
  metodoPagamento MetodoPagamento
  paymentId       String?       @unique  // ID do Mercado Pago — idempotência
  expiresAt       DateTime?     // para PIX: now + 30min
  participantes   Participante[]
  pagamento       Pagamento?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Participante {
  id                  String     @id @default(cuid())
  nome                String
  cpf                 String     // armazenar com hash bcrypt — nunca em plain text
  dataNascimento      DateTime
  telefone            String
  email               String
  contatoEmergencia   String
  tamanhoCamiseta     TamanhoCamiseta
  categoriaId         String
  categoria           Categoria  @relation(fields: [categoriaId], references: [id])
  pedidoId            String
  pedido              Pedido     @relation(fields: [pedidoId], references: [id])
  numeroPeito         Int?       // preenchido após importação da planilha de cronometragem
  checkinRealizadoEm  DateTime?
  createdAt           DateTime   @default(now())

  @@index([cpf])
  @@index([email])
  @@index([categoriaId])
}

model Pagamento {
  id                String   @id @default(cuid())
  pedidoId          String   @unique
  pedido            Pedido   @relation(fields: [pedidoId], references: [id])
  paymentIdGateway  String   @unique  // Mercado Pago payment ID
  valor             Float
  metodo            MetodoPagamento
  status            String
  webhookRecebidoEm DateTime?
  createdAt         DateTime @default(now())
}

model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  senha     String   // bcrypt hash
  nome      String
  role      AdminRole @default(OPERACIONAL)
  logs      AdminLog[]
  createdAt DateTime @default(now())
}

model AdminLog {
  id             String    @id @default(cuid())
  adminId        String
  admin          AdminUser @relation(fields: [adminId], references: [id])
  acao           String
  entidade       String
  entidadeId     String
  valorAnterior  String?
  valorNovo      String?
  createdAt      DateTime  @default(now())
}

enum TipoCategoria   { CIDADAO POLICIAL }
enum StatusPedido    { AGUARDANDO_PAGAMENTO PAGO RECUSADO EXPIRADO CANCELADO }
enum MetodoPagamento { PIX CARTAO }
enum TamanhoCamiseta { PP P M G GG XGG }
enum AdminRole       { TOTAL OPERACIONAL }
```

---

## Regras de Negócio Críticas

### Preço
```typescript
// packages/types/src/pricing.ts
export function calcularPreco(
  tipoCategoria: 'CIDADAO' | 'POLICIAL',
  precoCidadaoLoteAtivo: number
): number {
  if (tipoCategoria === 'POLICIAL') return 80.00  // sempre fixo
  return precoCidadaoLoteAtivo                     // 80 | 85 | 90
}
```

### Controle de vagas
```typescript
// Sempre verificar na API antes de persistir
// packages/db/src/queries/categoria.ts
export async function verificarVaga(categoriaId: string): Promise<boolean> {
  const cat = await prisma.categoria.findUnique({ where: { id: categoriaId } })
  if (!cat) throw new Error('Categoria não encontrada')
  return cat.vagasOcupadas < cat.vagasTotal
}

// Usar transação ao confirmar pagamento para evitar race condition
export async function confirmarVagas(categoriaIds: string[]) {
  return prisma.$transaction(
    categoriaIds.map(id =>
      prisma.categoria.updateMany({
        where: { id, vagasOcupadas: { lt: prisma.categoria.fields.vagasTotal } },
        data: { vagasOcupadas: { increment: 1 } }
      })
    )
  )
}
```

### PIX — dados só persistem após pagamento confirmado
```typescript
// apps/api/src/app/api/v1/inscricao/route.ts
// POST /api/v1/inscricao — NÃO persiste participantes ainda
// Apenas cria o pedido com status AGUARDANDO_PAGAMENTO e retorna QR code

// apps/api/src/app/api/v1/webhook/mercadopago/route.ts
// Webhook: valida assinatura → verifica idempotência → persiste participantes → dispara e-mail
```

### Webhook — idempotência obrigatória
```typescript
// Verificar se payment_id já foi processado ANTES de qualquer escrita
const jaProcessado = await prisma.pagamento.findUnique({
  where: { paymentIdGateway: paymentId }
})
if (jaProcessado) return NextResponse.json({ ok: true }) // 200 silencioso
```

---

## Estrutura de Rotas

### apps/web (porta 3000)
```
/                          ← landing page
/inscricao                 ← fluxo multi-step de inscrição
/inscricao/confirmacao     ← tela pós-pagamento
/pedido/[id]               ← status do pedido (sem login)
```

### apps/api (porta 3001)
```
/api/v1/categorias         GET  — lista categorias com vagas disponíveis e lote ativo
/api/v1/inscricao          POST — inicia inscrição, retorna QR code PIX ou token cartão
/api/v1/inscricao/[id]     GET  — status do pedido
/api/v1/webhook/mercadopago POST — webhook Mercado Pago (validar x-signature)
```

### apps/admin (porta 3002)
```
/login                     ← autenticação admin
/dashboard                 ← totalizadores
/participantes             ← lista com filtros
/participantes/[id]        ← detalhe + edição
/camisetas                 ← estoque por tamanho
/lotes                     ← gestão de lotes
/checkin                   ← módulo de check-in presencial
/checkin/importar          ← upload da planilha de cronometragem
```

---

## Frontend — Componentes Existentes (apps/web)

Estes componentes já existem e devem ser **reaproveitados** — não recrie:

```
src/components/atoms/
  button.tsx        ← variantes: default, secondary, outline, ghost
  input.tsx         ← wrapper do shadcn com estilo do projeto
  card.tsx          ← card, CardHeader, CardTitle, CardContent
  checkbox.tsx      ← wrapper do shadcn
  typography.tsx    ← h1/h2/h3/p/label com variantes
  badge.tsx         ← variantes: default, secondary, yellow, orange
  logo.tsx          ← logo do evento
  separator.tsx

src/components/molecules/
  pricing-card.tsx  ← card de modalidade com preço (adaptar para iniciar /inscricao)
  course-card.tsx
  info-card.tsx
  countdown-timer.tsx

src/components/organisms/
  Header.tsx, Footer.tsx, Hero.tsx, Countdown.tsx
  Routes.tsx        ← mapas Strava (manter)
  Registration.tsx  ← adaptar: botão "Inscrever" navega para /inscricao
  RaceInfo.tsx, HistoryGallery.tsx
```

**Correção necessária em landing-page-data.ts:**
- Alterar distância da rota avançada de `"8KM"` para `"10KM"`
- Remover preços hardcoded — substituir por chamada à API `/api/v1/categorias`

---

## Fluxo de Inscrição — /inscricao

Multi-step em `apps/web`. Cada step é um componente em `src/app/inscricao/steps/`.

```
Step 1: SelecionarCategoria   ← lista categorias da API; policial mostra aviso de autodeclaração
Step 2: FormularioInscrito    ← dados do inscrito; botão "Adicionar outro" repete (max 5)
Step 3: RevisarPedido         ← resumo editável; aceite de regulamento + termo policial
Step 4: Pagamento             ← PIX (QR + polling) ou Cartão (SDK MP)
Step 5: Confirmacao           ← resumo + número do pedido + instrução kit
```

Estado do fluxo gerenciado com Zustand ou React Context — não use URL params para dados sensíveis.

---

## Integração Mercado Pago

### Documentação de referência
- SDK Node: https://github.com/mercadopago/sdk-nodejs
- Checkout API (custom): https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

### PIX
```typescript
import MercadoPago, { Payment } from 'mercadopago'

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! })

const payment = await new Payment(mp).create({
  body: {
    transaction_amount: total,
    payment_method_id: 'pix',
    payer: { email, first_name: nome },
    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    description: `Inscrição Corrida PC — Pedido ${pedidoId}`,
    external_reference: pedidoId,
  }
})
// Retornar: payment.point_of_interaction.transaction_data.qr_code
//           payment.point_of_interaction.transaction_data.qr_code_base64
```

### Validação de webhook
```typescript
import crypto from 'crypto'

export function validarWebhookMP(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET!
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',')[0].split('=')[1]};`
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  const received = xSignature.split(',')[1]?.split('=')[1]
  return hash === received
}
```

---

## E-mail — packages/email

Use React Email + Resend.

```typescript
// packages/email/src/templates/ConfirmacaoInscricao.tsx
// packages/email/src/templates/LembretePix.tsx
// packages/email/src/send.ts — wrapper do Resend

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarConfirmacao(pedido: PedidoComParticipantes) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: pedido.participantes.map(p => p.email),
    subject: `Inscrição confirmada — Corrida do Policial Civil`,
    react: <ConfirmacaoInscricao pedido={pedido} />,
  })
}
```

---

## Scripts (raiz do monorepo)

```json
{
  "scripts": {
    "dev":          "turbo dev",
    "build":        "turbo build",
    "lint":         "turbo lint",
    "typecheck":    "turbo typecheck",
    "db:migrate":   "cd packages/db && pnpm prisma migrate dev",
    "db:generate":  "cd packages/db && pnpm prisma generate",
    "db:studio":    "cd packages/db && pnpm prisma studio",
    "db:seed":      "cd packages/db && pnpm prisma db seed"
  }
}
```

---

## Turbo Pipeline (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build":      { "dependsOn": ["^build"], "outputs": [".next/**"] },
    "dev":        { "cache": false, "persistent": true },
    "lint":       {},
    "typecheck":  { "dependsOn": ["^build"] }
  }
}
```

---

## Deploy na Vercel

Cada app em `apps/` é um projeto separado na Vercel apontando para o mesmo repositório.

| Projeto Vercel | Root Directory | Build Command |
|---|---|---|
| `corrida-web` | `apps/web` | `cd ../.. && pnpm build --filter=web` |
| `corrida-api` | `apps/api` | `cd ../.. && pnpm build --filter=api` |
| `corrida-admin` | `apps/admin` | `cd ../.. && pnpm build --filter=admin` |

Variável de ambiente `DATABASE_URL` (Neon) configurada nos três projetos.

---

## Checklist de Segurança (revisar antes de cada PR)

- [ ] Nenhum dado de cartão em logs ou banco
- [ ] Webhook validado com `validarWebhookMP()` antes de processar
- [ ] CPF armazenado como hash — nunca em plain text
- [ ] Rate limiting ativo no endpoint `/api/v1/inscricao` (10 req/min por IP)
- [ ] `.env` não commitado — apenas `.env.example`
- [ ] Idempotência: `paymentId` único verificado antes de persistir

---

## Referências Rápidas

- PRD completo: `docs/PRD-v2.md`
- Schema Prisma: `packages/db/prisma/schema.prisma`
- Tipos compartilhados: `packages/types/src/index.ts`
- Componentes atom: `apps/web/src/components/atoms/`
- Regras de preço: `packages/types/src/pricing.ts`
---

## Estado Atual do Projeto (atualizar a cada fase)

### Concluído
- US-001: monorepo pnpm workspaces + Turborepo
- US-002: correções frontend (preços, distâncias, routing /inscricao)
- US-003: schema Prisma completo, client singleton, seed, migration aplicada no Neon

### Banco de Dados
- Neon PostgreSQL — connection string em `.env.local` (DATABASE_URL)
- Migration aplicada: `20260416000000_init`
- Seed: `pnpm db:seed` cria 4 categorias + 2 lotes

### Convenções de Import
- Prisma client: `import { prisma } from "@corrida/db"`
- Tipos Prisma: `import { Participante, StatusPedido } from "@corrida/db"`
- Tipos locais: `import { ... } from "@corrida/types"`
- Validações Zod: `import { ... } from "@corrida/validations"`

### Porta dos apps em dev
- web: 3000
- api: 3001  
- admin: 3002
