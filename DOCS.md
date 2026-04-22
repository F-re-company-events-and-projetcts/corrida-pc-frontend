# Documentação Técnica — Plataforma de Inscrições Corrida do Policial Civil

> **Para quem é este documento:** desenvolvedor que vai manter, expandir ou debugar este projeto.
> Leia do início ao fim antes de mexer em qualquer código.
> Última atualização: Fase 1 (US-001 a US-013) — fluxo de inscrição e pagamento completos.

---

## Visão Geral

Sistema de inscrições online para a 2ª Corrida do Policial Civil de Coxim-MS (27/Set/2026).

**O que o sistema faz:**
- Exibe categorias e preços atuais na landing page (consumindo banco em tempo real)
- Conduz o usuário por um fluxo de 5 passos: categoria → dados → revisão → pagamento → confirmação
- Aceita até 5 inscritos por transação
- Processa PIX e Cartão de Crédito via Mercado Pago
- Envia confirmação por e-mail após pagamento (pendente — US-016)
- Oferece painel administrativo para os organizadores (pendente — US-018 a US-023)

**O que o sistema não faz:**
- Não tem login para o inscrito — o pedido é identificado pelo ID e e-mail
- Não processa reembolso automaticamente — é manual pelo organizador
- Não tem fila de espera — vagas esgotadas ficam desabilitadas

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  apps/web    │      │  apps/admin  │                 │
│  │  (Next.js)   │      │  (Next.js)   │                 │
│  │  porta 3000  │      │  porta 3002  │                 │
│  └──────┬───────┘      └──────┬───────┘                 │
└─────────┼────────────────────┼─────────────────────────┘
          │ fetch              │ fetch
          ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│  apps/api  (Next.js API Routes — porta 3001)             │
│  /api/v1/categorias                                      │
│  /api/v1/inscricao                                       │
│  /api/v1/inscricao/[id]                                  │
│  /api/v1/inscricao/[id]/cartao                           │
│  /api/v1/webhook/mercadopago   ◄─── Mercado Pago         │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma
                           ▼
                  ┌─────────────────┐
                  │  PostgreSQL      │
                  │  (Neon Cloud)    │
                  └─────────────────┘
```

Os três apps são projetos Next.js separados dentro de um monorepo pnpm + Turborepo. Em produção cada um é um projeto independente na Vercel, mas compartilham o mesmo banco PostgreSQL.

---

## Fluxo Completo de Inscrição

### Visão do usuário

```
Landing Page → Clica "Inscrever-se" → /inscricao

Step 1: Escolhe categoria (4KM Cidadão / 4KM Policial / 10KM Cidadão / 10KM Policial)
Step 2: Preenche dados dos inscritos (nome, CPF, nascimento, telefone, email, camiseta)
         Pode adicionar até 4 inscritos a mais (total máximo: 5)
Step 3: Revisa pedido, escolhe PIX ou Cartão, aceita regulamento
Step 4a (PIX): Exibe QR code + código copia-cola, countdown de 30min, polling automático
Step 4b (Cartão): Formulário seguro (iframes do Mercado Pago), processa na hora
Step 5: Confirmação com número do pedido e instrução de retirada de kit
```

### Visão do sistema (PIX)

```
1. POST /api/v1/inscricao
   ├── Valida body com CriarPedidoSchema (Zod)
   ├── Verifica vagas disponíveis por categoria
   ├── Calcula total (policial: R$80 fixo; cidadão: lote ativo)
   ├── Cria Pedido no banco (status: AGUARDANDO_PAGAMENTO, expiresAt: +30min)
   ├── Chama MP para gerar PIX → obtém qrCode + qrCodeBase64
   ├── Salva PedidoRascunho com JSON dos inscritos (necessário para o webhook)
   └── Retorna { pedidoId, qrCode, qrCodeBase64, expiresAt }

2. Frontend faz polling GET /api/v1/inscricao/[id] a cada 3 segundos

3. Mercado Pago envia POST /api/v1/webhook/mercadopago
   ├── Valida assinatura HMAC-SHA256 (x-signature header)
   ├── Verifica idempotência (paymentIdGateway já existe?)
   ├── Busca PedidoRascunho pelo pedidoId (external_reference)
   ├── Transação atômica:
   │   ├── Cria Participantes (CPF em bcrypt)
   │   ├── Cria Pagamento
   │   ├── Atualiza Pedido para PAGO
   │   ├── Incrementa vagasOcupadas por categoria
   │   └── Deleta PedidoRascunho
   └── Retorna 200

4. Polling detecta status PAGO → navega para /inscricao/confirmacao
```

### Visão do sistema (Cartão)

```
1. POST /api/v1/inscricao (metodoPagamento: CARTAO)
   ├── Valida e verifica vagas (igual ao PIX)
   ├── Cria Pedido (não gera PIX, não cria rascunho)
   └── Retorna { pedidoId, total }

2. Frontend usa SDK MP (iframes seguros) para coletar dados do cartão
   └── Obtém token temporário (nunca os dados do cartão)

3. POST /api/v1/inscricao/[id]/cartao
   ├── Valida pedido (existe, é CARTAO, está AGUARDANDO_PAGAMENTO)
   ├── Envia token ao Mercado Pago
   ├── Se aprovado → transação atômica (participantes + pagamento + vagas)
   └── Se recusado → retorna 402 com mensagem traduzida
```

---

## Decisões de Projeto — por que foi feito assim

### Por que o CPF é armazenado como hash?

CPF é dado pessoal sensível. Em caso de vazamento do banco, hashes bcrypt não são reversíveis. A desvantagem é que não dá para buscar pelo CPF exato — no check-in presencial, o admin consulta pelo nome ou pelo número de peito, não pelo CPF.

### Por que existe o PedidoRascunho?

O PIX tem uma janela de tempo entre a criação do QR code e a confirmação do pagamento. Nessa janela, os dados dos inscritos ainda não devem ser persistidos como definitivos (o usuário pode desistir, o PIX pode expirar). O `PedidoRascunho` guarda os dados temporariamente em JSON — quando o webhook confirma o pagamento, os dados são persistidos definitivamente e o rascunho é deletado.

Para cartão isso não é necessário porque o pagamento é processado e confirmado em tempo real.

### Por que o preço do Policial é hardcoded em R$ 80?

Decisão do cliente. O preço do Policial nunca varia com o lote — é fixo para todas as forças de segurança. O Lote só afeta o preço do Cidadão (1º Lote: R$80, 2º: R$85, 3º: R$90).

### Por que o frontend polling ao invés de WebSocket?

Simplicidade. WebSockets em Vercel Functions têm limitações e custo maior. Polling a cada 3 segundos é aceitável para a UX de pagamento PIX — a janela de 30 minutos dá tempo suficiente. O polling para quando o status é confirmado ou quando o componente é desmontado.

### Por que o card form usa iframes do Mercado Pago?

Conformidade com PCI-DSS. Os dados do cartão nunca trafegam pelo nosso servidor — o SDK do MP captura direto nos iframes, gera um token de uso único, e esse token é o que enviamos para a nossa API. Se nosso servidor fosse comprometido, nenhum dado de cartão estaria exposto.

---

## Segurança — pontos críticos

### 1. Validação de webhook

Todo webhook do Mercado Pago vem com um header `x-signature` que é um HMAC-SHA256 de um manifest específico. A validação acontece **antes** de qualquer processamento. Se a assinatura for inválida, retornamos 401 e não fazemos nada.

O manifest tem formato exato: `id:{payment_id};request-id:{x-request-id};ts:{timestamp};`

A ordem e os ponto-e-vírgulas finais são obrigatórios. Qualquer variação faz a validação falhar.

### 2. Idempotência do webhook

O Mercado Pago pode enviar o mesmo evento mais de uma vez (retry em caso de timeout, por exemplo). Antes de processar um pagamento, verificamos se já existe um `Pagamento` com aquele `paymentIdGateway`. Se sim, retornamos 200 silencioso sem fazer nada.

### 3. CPF nunca em plain text

```typescript
// Sempre assim:
const cpfHash = await bcrypt.hash(cpf.replace(/\D/g, ''), 10)

// Nunca assim:
const cpf = inscricao.cpf  // e salvar direto no banco
```

### 4. Rate limiting

O endpoint `POST /api/v1/inscricao` tem rate limiting em memória: máximo 10 requisições por IP por minuto. É uma proteção básica contra bots. Em produção com múltiplas instâncias Vercel, considerar migrar para Redis.

---

## Banco de Dados

### Migrations

Toda mudança de schema deve ter uma migration correspondente. Nunca edite o schema sem criar uma migration — o Prisma detecta divergências e se recusa a rodar em produção.

```bash
# Para criar uma nova migration:
cd packages/db
DATABASE_URL="..." npx prisma migrate dev --name nome_descritivo

# Ou com o arquivo .env configurado:
pnpm db:migrate
```

### Seed

O seed cria as 4 categorias e 2 lotes iniciais. Rodar em caso de reset do banco:

```bash
cd packages/db
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Migrations aplicadas

| Migration | O que faz |
|---|---|
| `20260416000000_init` | Cria todas as tabelas e enums |
| `20260421000000_add_pedido_rascunho` | Adiciona tabela `PedidoRascunho` com FK em cascata |

---

## Frontend — Estrutura do Fluxo de Inscrição

O fluxo é um multi-step dentro de `apps/web/src/app/inscricao/`. O estado é compartilhado via `InscricaoContext` que envolve todo o layout.

```
inscricao/
├── layout.tsx              ← InscricaoProvider + StepProgressBar + container
├── page.tsx                ← server component, fetch categorias → SelecionarCategoriaStep
├── SelecionarCategoriaStep.tsx  ← client, step 1
├── StepProgressBar.tsx     ← client, detecta step pelo pathname
├── dados/
│   ├── page.tsx            ← server component, fetch categorias → DadosStep
│   └── DadosStep.tsx       ← client, react-hook-form, múltiplos inscritos
├── revisao/
│   ├── page.tsx            ← server component, fetch categorias → RevisaoStep
│   └── RevisaoStep.tsx     ← client, resumo + método pagamento + checkboxes
└── pagamento/
    ├── page.tsx            ← client (precisa do context), chama POST /inscricao
    └── CardPaymentStep.tsx ← client, carrega SDK MP, mp.cardForm()
```

**Padrão adotado:** server components fazem o fetch de dados (categorias) e passam para client components via props. Isso evita waterfalls e mantém a lógica de estado no client onde pertence.

### InscricaoContext

O contexto persiste o estado entre os steps enquanto o usuário está na sessão. Se o usuário fechar o browser e voltar, o contexto é perdido — ele precisa recomeçar do Step 1.

Estado atual:
```typescript
{
  categoriaId: string | null      // step 1
  inscricoes: InscricaoInput[]    // step 2
  metodoPagamento: 'PIX' | 'CARTAO' | null  // step 3
  // pedidoId: string | null      // a adicionar na US-014
}
```

---

## API — Contratos

### GET /api/v1/categorias

**Response 200:**
```typescript
Array<{
  id: string
  nome: string
  percursoKm: number
  tipo: 'CIDADAO' | 'POLICIAL'
  vagasTotal: number
  vagasOcupadas: number
  vagasDisponiveis: number   // calculado: vagasTotal - vagasOcupadas
  precoAtual: number | null  // null se nenhum lote ativo
}>
```

Headers: `Cache-Control: public, max-age=30`

### POST /api/v1/inscricao

**Request:**
```typescript
{
  inscricoes: Array<{
    nome: string
    cpf: string        // validado com dígito verificador
    dataNascimento: string  // ISO string
    telefone: string   // apenas dígitos
    email: string
    contatoEmergencia: string
    tamanhoCamiseta: 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XGG'
    categoriaId: string
  }>
  metodoPagamento: 'PIX' | 'CARTAO'
}
```

**Response 201 (PIX):**
```typescript
{ pedidoId: string, qrCode: string, qrCodeBase64: string, expiresAt: string }
```

**Response 201 (Cartão):**
```typescript
{ pedidoId: string, total: number }
```

**Erros:**
- 400 — validação falhou
- 409 — vagas insuficientes ou nenhum lote ativo
- 429 — rate limit (10 req/min/IP)
- 502 — erro ao chamar Mercado Pago

### GET /api/v1/inscricao/[id]

**Response 200:**
```typescript
{ id: string, status: StatusPedido, expiresAt: string | null, metodoPagamento: string, total: number }
```

### POST /api/v1/inscricao/[id]/cartao

**Request:**
```typescript
{ token: string, installments: number, issuerId?: string, paymentMethodId: string, inscricoes: InscricaoInput[] }
```

**Response 200:** `{ ok: true, pedidoId: string }`

**Erros:**
- 402 — cartão recusado (com mensagem traduzida)
- 404 — pedido não encontrado
- 409 — pedido não está aguardando pagamento
- 502 — erro de comunicação com MP

### POST /api/v1/webhook/mercadopago

Chamado pelo Mercado Pago. Não chamar diretamente.
Valida assinatura → processa → retorna 200 em menos de 5s.

---

## Mercado Pago — Notas Práticas

### Credenciais

Existem dois sets de credenciais:
- **Teste (`TEST-`)** — use em desenvolvimento. Pagamentos são simulados, sem dinheiro real.
- **Produção (`APP_USR-`)** — use somente no deploy final. Cobranças reais.

O cliente enviou as credenciais de produção. Em desenvolvimento, use sempre as de teste que estão no `.env.local`.

`CLIENT_ID` e `CLIENT_SECRET` não são usados nesta integração.

### Testar webhook localmente

O Mercado Pago precisa de uma URL pública para enviar webhooks. Em desenvolvimento, use ngrok:

```bash
ngrok http 3001
# Copiar a URL https://xxx.ngrok.io
# Configurar no painel MP: https://xxx.ngrok.io/api/v1/webhook/mercadopago
# Adicionar o MP_WEBHOOK_SECRET gerado ao .env.local
```

### Simular pagamento PIX (sandbox)

No painel do Mercado Pago com credenciais de teste, existe um simulador de pagamentos. Após gerar um PIX real em sandbox, use o simulador para aprovar/rejeitar.

### Códigos de rejeição de cartão

Os principais códigos já estão mapeados em `apps/api/src/app/api/v1/inscricao/[id]/cartao/route.ts`:

```typescript
const REJECTION_MESSAGES = {
  cc_rejected_insufficient_amount: "Saldo insuficiente no cartão.",
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
  cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro cartão.",
  cc_rejected_call_for_authorize: "Contacte seu banco para autorizar o pagamento.",
  cc_rejected_duplicated_payment: "Pagamento duplicado detectado.",
  cc_rejected_card_disabled: "Cartão desabilitado — entre em contato com seu banco.",
}
```

---

## Painel Admin — Pendente (US-018 a US-023)

O `apps/admin` existe mas não tem implementação ainda. As stories planejadas:

| Story | Funcionalidade |
|---|---|
| US-018 | Autenticação JWT com bcrypt, middleware de proteção |
| US-019 | Dashboard: totais de inscrições, arrecadação, vagas por categoria |
| US-020 | Lista de participantes com filtros (categoria, status, camiseta) + exportação CSV |
| US-021 | Detalhe do participante, edição de dados, AdminLog de alterações |
| US-022 | Check-in presencial: busca por nome, confirma vínculo policial |
| US-023 | Importação de planilha de cronometragem → número de peito |

---

## Como Adicionar uma Nova Feature

1. **Leia o `prd.json`** na raiz — cada story tem ID, critérios de aceite e dependências.

2. **Abra um chat novo no Claude Code** com o `CLAUDE.md` como contexto, seguido do prompt da story específica.

3. **Um story por sessão** do Claude Code. Para stories simples sequenciais, duas por sessão é aceitável, mas o risco de inconsistência aumenta.

4. **Após o código estar pronto**, rode o typecheck antes de commitar:
   ```bash
   pnpm --filter @corrida/[app] typecheck
   ```

5. **Commite com mensagem descritiva:**
   ```bash
   git commit -m "feat([app]): complete US-XXX - descrição breve"
   ```

6. **Atualize este arquivo e o `CLAUDE.md`** ao final de cada fase (grupo de stories relacionadas). Isso mantém o contexto vivo para o próximo desenvolvedor — ou para a próxima sessão.

---

## Troubleshooting Comum

### Prisma não encontra DATABASE_URL

```bash
# packages/db/.env deve ter a DATABASE_URL
# Se não existir:
grep DATABASE_URL .env.local > packages/db/.env
```

### Migration diverge do schema aplicado

Isso acontece se o schema foi editado sem criar migration (ex: `db push` em vez de `migrate dev`).

```bash
cd packages/db
npx prisma migrate reset --force  # APAGA TODOS OS DADOS
# Depois rodar o seed:
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Webhook recebendo 401

Verifique:
1. `MP_WEBHOOK_SECRET` está preenchido no `.env.local`
2. O manifest está na ordem correta: `id:{...};request-id:{...};ts:{...};`
3. Está usando as credenciais corretas (TEST- para sandbox)

### PIX gerado mas participantes não criados

O webhook não foi processado. Possíveis causas:
- `MP_WEBHOOK_SECRET` incorreto (401 silencioso)
- URL do webhook não configurada no painel MP
- Timeout — o webhook precisa responder em menos de 5s

Verificar logs da Vercel (em produção) ou do servidor local.

### Seed falha com erro de aspas (zsh)

```bash
# Rodar dentro de packages/db/
cd packages/db
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## Ciclo de Atualização desta Documentação

Esta documentação deve ser atualizada ao final de cada fase de desenvolvimento. Uma "fase" corresponde a um grupo de stories que entregam uma funcionalidade completa ao usuário ou ao organizador.

**Fases planejadas:**

| Fase | Stories | Entrega |
|---|---|---|
| Fase 1 ✅ | US-001 a US-013 | Fluxo de inscrição e pagamento completo |
| Fase 2 | US-014 a US-017 | Confirmação, e-mail e expiração automática |
| Fase 3 | US-018 a US-023 | Painel admin, check-in e cronometragem |

Ao final de cada fase, atualize:
- A tabela de estado no `CLAUDE.md`
- A seção "Próximas stories" no `CLAUDE.md`
- As seções relevantes neste `DOCS.md` (rotas, modelos, decisões de projeto)

Manter essa documentação viva é mais valioso do que qualquer comentário no código — ela captura o **porquê** das decisões, não apenas o **o quê**.
