# Backlog de Implementacao do PRD

Plataforma de Inscricoes - Corrida do Policial Civil

Este arquivo lista o que falta para deixar o projeto aderente ao PRD v2.0 e pronto para go-live. Ele tambem formaliza a decisao de criar um `numeroPedido` publico, curto e legivel para consulta de inscricao pelo candidato.

Legenda:
- `P0`: bloqueador para go-live.
- `P1`: necessario para aderencia forte ao MVP.
- `P2`: melhoria ou requisito Should/Could do PRD.

---

## Decisao: Numero Publico do Pedido

Hoje o e-mail mostra apenas os 8 primeiros caracteres do `pedidoId` interno. Isso nao e ideal para consulta publica.

Decisao adotada: criar um campo publico `numeroPedido`, independente do `id` tecnico.

Formato recomendado:

```text
PC-2026-000001
PC-2026-000002
PC-2026-000003
```

Regras:
- `id` continua sendo tecnico, usado internamente e em relacoes do banco.
- `numeroPedido` passa a ser exibido para o candidato.
- `numeroPedido` deve ser unico.
- E-mail, confirmacao e pagina de status devem exibir `numeroPedido`.
- Consulta publica deve usar `numeroPedido` + e-mail do titular.
- Nao usar prefixo parcial do `id` como identificador publico.

Implementacao sugerida:
- Adicionar em `Pedido`:

```prisma
numeroPedidoSeq Int?    @unique @default(autoincrement())
numeroPedido    String? @unique
```

- Preencher `numeroPedido` apos criar o pedido, usando o sequencial:

```text
PC-2026-${numeroPedidoSeq.toString().padStart(6, "0")}
```

- Tornar os campos obrigatorios depois de backfill dos pedidos existentes, se houver dados reais.

Arquivos provaveis:
- `packages/db/prisma/schema.prisma`
- nova migration Prisma
- `apps/api/src/app/api/v1/inscricao/route.ts`
- `apps/api/src/app/api/v1/inscricao/[id]/route.ts`
- `packages/email/src/send.ts`
- `packages/email/src/templates/ConfirmacaoInscricao.tsx`
- `apps/web/src/app/inscricao/confirmacao/page.tsx`
- `apps/web/src/app/pedido/[id]/page.tsx`

---

## P0 - Bloqueadores de Go-Live

### Ambiente e Credenciais

- [ ] Criar `apps/api/.env.local`.
- [ ] Criar `apps/web/.env.local`.
- [ ] Criar `apps/admin/.env.local`.
- [ ] Criar `packages/db/.env`.
- [ ] Configurar `DATABASE_URL`.
- [ ] Configurar `MP_ACCESS_TOKEN` sandbox.
- [ ] Configurar `NEXT_PUBLIC_MP_PUBLIC_KEY` sandbox.
- [ ] Configurar `MP_WEBHOOK_SECRET`.
- [ ] Configurar `RESEND_API_KEY`.
- [ ] Configurar `EMAIL_FROM`.
- [ ] Configurar `CRON_SECRET`.
- [ ] Configurar `ADMIN_JWT_SECRET`.
- [ ] Rodar `pnpm db:generate`.
- [ ] Rodar migrations.
- [ ] Rodar seed de categorias/lotes.
- [ ] Rodar seed do admin.

Criterio de aceite:
- `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.
- `pnpm dev` sobe `web`, `api` e `admin`.
- API consegue conectar no banco.

### Lotes e Precos do PRD

- [ ] Ajustar seed para refletir o PRD: promocional encerrado, 1o lote cidadao R$ 85, 2o lote cidadao R$ 90.
- [ ] Garantir preco policial fixo em R$ 80.
- [ ] Remover datas/precos hardcoded da timeline da landing ou carregar de API.
- [ ] Conferir se categorias exibem 4KM/10KM corretamente.
- [ ] Garantir que categoria esgotada bloqueia CTA.

Criterio de aceite:
- Landing e fluxo de inscricao usam dados de API para preco e vagas.
- Policial sempre custa R$ 80, independente do lote.

### Controle Transacional de Vagas

Risco atual: a API valida vagas ao criar pedido, mas a vaga nao e reservada. Se muitos PIX forem pagos ao mesmo tempo, pode haver sobrevenda.

- [ ] Revalidar vagas dentro da transacao de confirmacao do pagamento PIX.
- [ ] Revalidar vagas dentro da transacao de confirmacao do cartao.
- [ ] Impedir incremento de `vagasOcupadas` acima de `vagasTotal`.
- [ ] Definir comportamento quando o pagamento e aprovado mas nao ha vaga disponivel.
- [ ] Registrar log/erro operacional para excecao de vaga indisponivel apos pagamento.

Criterio de aceite:
- Com 1 vaga restante, duas confirmacoes concorrentes nao podem criar 2 participantes na mesma categoria.

### PedidoRascunho e Dados Antes do PIX Pago

O PRD diz que nenhum dado do inscrito deve ser persistido antes do pagamento PIX. Hoje existe `PedidoRascunho.inscricoesJson` com dados pessoais temporarios.

- [ ] Decidir se o produto aceita persistencia temporaria criptografada.
- [ ] Se aceitar: criptografar `inscricoesJson` em repouso e documentar a excecao.
- [ ] Se nao aceitar: substituir por estrategia alternativa, por exemplo token temporario criptografado fora do banco ou fluxo que persiste somente apos webhook.
- [ ] Definir limpeza garantida de rascunhos expirados.

Criterio de aceite:
- Decisao documentada.
- Implementacao compativel com LGPD e PRD.

### Mercado Pago - PIX

- [ ] Testar criacao de pedido PIX em sandbox.
- [ ] Testar exibicao de QR Code.
- [ ] Testar codigo copia-cola.
- [ ] Testar webhook real via URL publica temporaria.
- [ ] Testar idempotencia de webhook duplicado.
- [ ] Validar `transaction_amount` do Mercado Pago contra `pedido.total` antes de confirmar.
- [ ] Testar PIX expirado.
- [ ] Testar cron de expiracao.

Criterio de aceite:
- Pedido PIX pago vira `PAGO`.
- Participantes so sao criados apos pagamento aprovado.
- Vagas sao incrementadas corretamente.
- Webhook duplicado nao duplica participantes nem pagamentos.

### Mercado Pago - Cartao

- [ ] Testar cartao aprovado em sandbox.
- [ ] Testar cartao recusado em sandbox.
- [ ] Testar tentativa posterior com outro cartao.
- [ ] Garantir que backend recebe apenas token, nunca numero completo ou CVV.
- [ ] Exibir parcelamento e juros do comprador antes da confirmacao.
- [ ] Definir numero maximo de parcelas.

Criterio de aceite:
- Cartao aprovado cria participantes e pagamento.
- Cartao recusado mostra feedback claro e nao cria participantes.

### NumeroPedido Publico

- [x] Criar migration para `numeroPedidoSeq` e `numeroPedido`.
- [x] Gerar `numeroPedido` ao criar pedido.
- [x] Retornar `numeroPedido` em `POST /api/v1/inscricao`.
- [x] Retornar `numeroPedido` em `GET /api/v1/inscricao/[id]`.
- [x] Exibir `numeroPedido` na confirmacao.
- [x] Exibir `numeroPedido` na pagina de status.
- [x] Enviar `numeroPedido` no e-mail.
- [x] Atualizar assunto do e-mail para usar `numeroPedido`.
- [x] Criar endpoint de consulta por `numeroPedido` + e-mail.
- [x] Criar pagina publica `/consultar-inscricao`.

Criterio de aceite:
- Candidato consegue consultar a inscricao usando `numeroPedido` e e-mail, sem saber o `id` tecnico.

---

## P1 - Requisitos MVP Ainda Pendentes

### Consulta Publica de Inscricao

Fluxo recomendado:

```text
/consultar-inscricao
Campos:
- numeroPedido
- email

POST /api/v1/consulta-inscricao
Body:
{
  "numeroPedido": "PC-2026-000123",
  "email": "candidato@email.com"
}
```

- [x] Criar schema de validacao.
- [x] Criar endpoint `POST /api/v1/consulta-inscricao`.
- [x] Validar que o e-mail pertence a algum participante do pedido.
- [x] Para PIX pendente, decidir se consulta pode ler `PedidoRascunho`.
- [x] Retornar resposta resumida, sem dados sensiveis.
- [x] Criar pagina `/consultar-inscricao`.
- [x] Adicionar link no header/footer/confirmacao.

Resposta sugerida:

```json
{
  "numeroPedido": "PC-2026-000123",
  "status": "PAGO",
  "metodoPagamento": "PIX",
  "total": 160,
  "participantes": [
    { "nome": "Maria Silva", "categoria": "4KM Cidadao" }
  ],
  "updatedAt": "2026-06-05T12:00:00.000Z"
}
```

### Validacoes do Participante

- [ ] Validar idade minima de 15 anos.
- [ ] Exibir aviso para menores de 18 anos sobre autorizacao do responsavel.
- [ ] Exibir politica de reembolso no checkout.
- [ ] Exibir aceite LGPD/politica de privacidade.
- [ ] Garantir telefone com mascara/normalizacao consistente.
- [ ] Garantir CPF unico na mesma transacao.
- [ ] Avaliar bloqueio de CPF ja inscrito em pedido pago.

### E-mail Transacional

- [x] Atualizar e-mail para usar `numeroPedido`.
- [x] Incluir link de consulta `/consultar-inscricao`.
- [ ] Incluir instrucoes de retirada de kit.
- [ ] Incluir politica operacional basica.
- [ ] Implementar lembrete de PIX pendente 15 minutos antes de expirar.
- [ ] Definir SPF/DKIM/DMARC do dominio.

### Status do Pedido

- [x] Atualizar rota atual `/pedido/[id]` para aceitar ou redirecionar por `numeroPedido`.
- [ ] Evitar expor dados de pedido somente por ID publico sem validacao adicional.
- [x] Exibir status pendente/confirmado/recusado/expirado.
- [ ] Exibir numero de peito quando disponivel e pedido pago.

---

## P1 - Admin do PRD

### Participantes

- [ ] Criar pagina de detalhe do participante.
- [ ] Exibir todos os campos do formulario.
- [ ] Exibir historico de pagamento.
- [x] Exibir `numeroPedido`.
- [ ] Exibir numero de peito.
- [ ] Exibir check-in.
- [ ] Permitir edicao de nome.
- [ ] Permitir edicao de telefone.
- [ ] Permitir edicao de e-mail.
- [ ] Permitir edicao de contato de emergencia.
- [ ] Permitir edicao de tamanho de camiseta.
- [ ] Permitir edicao de categoria com cuidado sobre vagas/preco.
- [ ] Registrar log de auditoria para alteracoes.

### Busca e Filtros

- [ ] Filtro por tamanho de camiseta.
- [x] Busca por `numeroPedido`.
- [ ] Busca por numero de peito.
- [ ] Busca por CPF com estrategia segura.
- [ ] Decidir estrategia para CPF:
  - [ ] manter bcrypt e comparar contra candidatos filtrados;
  - [ ] adicionar hash deterministico com pepper para busca exata;
  - [ ] ou nao permitir busca por CPF e ajustar PRD.

### Exportacao

- [ ] Exportar participantes em CSV.
- [ ] Exportar participantes em XLSX.
- [ ] Incluir filtros atuais na exportacao.
- [ ] Incluir campos operacionais: categoria, camiseta, pagamento, numero de peito, check-in.
- [ ] Evitar exportar CPF completo se nao for necessario.

### Status Manual e Auditoria

- [ ] Criar acao admin para alterar status do pedido.
- [ ] Exigir motivo.
- [ ] Registrar `AdminLog`.
- [ ] Impedir alteracoes perigosas sem perfil `TOTAL`.
- [ ] Definir efeitos em vagas ao cancelar/reverter pagamento.

### Estoque de Camisetas

- [ ] Criar modelo `CamisetaEstoque`.
- [ ] Criar migration.
- [ ] Criar tela admin de estoque.
- [ ] Calcular comprometido por tamanho.
- [ ] Comparar comprometido vs disponivel.
- [ ] Atualizar estoque quando participante muda tamanho.

### Gestao de Lotes

- [ ] Criar CRUD admin de lotes.
- [ ] Ativar/desativar lote.
- [ ] Editar datas.
- [ ] Editar preco cidadao.
- [ ] Impedir mais de um lote ativo no mesmo periodo.
- [ ] Registrar log de auditoria.

### Check-in

- [ ] Buscar corredor por CPF, nome ou numero de peito.
- [ ] Exibir idade.
- [ ] Exibir status de pagamento.
- [ ] Exibir categoria.
- [ ] Exibir tamanho de camiseta.
- [ ] Permitir confirmar/editar tamanho no check-in.
- [ ] Registrar check-in.
- [ ] Impedir check-in duplicado.
- [ ] Exibir numero de peito.
- [ ] Exibir alerta para categoria policial validar comprovante presencialmente.

### Importacao de Numeracao

Hoje a importacao usa CPF + numero de peito. O PRD pede numero de peito + categoria, vinculando por categoria e ordem de inscricao.

- [ ] Definir template oficial da planilha.
- [ ] Aceitar colunas `numero_peito` e `categoria`.
- [ ] Vincular automaticamente por categoria e ordem de inscricao.
- [ ] Detectar conflitos de numero duplicado.
- [ ] Detectar categoria desconhecida.
- [ ] Listar corredores sem numero de peito.
- [ ] Exibir preview antes de confirmar importacao.
- [ ] Registrar log de importacao.

---

## P2 - Melhorias Tecnicas e Nao Funcionais

### Seguranca

- [ ] Avaliar CSRF nas rotas internas do admin.
- [ ] Implementar refresh token com rotacao ou documentar decisao de manter sessao simples.
- [ ] Avaliar 2FA para admin.
- [ ] Substituir rate limit em memoria por Redis/KV se rodar em serverless com escala horizontal.
- [ ] Revisar exposicao de dados em endpoints publicos.

### Performance

- [ ] Trocar `<img>` por `next/image` nas imagens principais da landing.
- [ ] Medir LCP em mobile.
- [ ] Otimizar imagens publicas.
- [ ] Evitar chamada desnecessaria de API durante build quando possivel.

### Next.js

- [ ] Migrar `apps/admin/src/middleware.ts` para a convencao `proxy` do Next 16.
- [ ] Revisar warnings de build.

### Observabilidade

- [ ] Adicionar logs estruturados para pagamento.
- [ ] Adicionar alertas para falha de webhook.
- [ ] Adicionar alertas para PIX aprovado sem vaga.
- [ ] Adicionar monitoramento de cron.
- [ ] Definir backup automatico do banco.

---

## Plano de Testes

### Verificacoes de Base

- [ ] `pnpm install`
- [ ] `pnpm db:generate`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`

### Teste Manual - PIX

- [ ] Abrir landing.
- [ ] Escolher categoria cidadao.
- [ ] Preencher 1 inscrito.
- [ ] Revisar pedido.
- [ ] Escolher PIX.
- [ ] Gerar QR Code.
- [ ] Confirmar que pedido ficou `AGUARDANDO_PAGAMENTO`.
- [ ] Pagar em sandbox.
- [ ] Receber webhook.
- [ ] Confirmar pedido `PAGO`.
- [ ] Confirmar criacao de participante.
- [ ] Confirmar incremento de vaga.
- [ ] Confirmar envio de e-mail.
- [ ] Consultar pelo `numeroPedido`.

### Teste Manual - PIX Expirado

- [ ] Gerar pedido PIX.
- [ ] Nao pagar.
- [ ] Executar cron de expiracao.
- [ ] Confirmar status `EXPIRADO`.
- [ ] Confirmar que participante nao foi criado.
- [ ] Confirmar que vaga nao foi ocupada.

### Teste Manual - Cartao

- [ ] Criar pedido com cartao.
- [ ] Usar cartao sandbox aprovado.
- [ ] Confirmar status `PAGO`.
- [ ] Confirmar participante e pagamento.
- [ ] Criar novo pedido.
- [ ] Usar cartao sandbox recusado.
- [ ] Confirmar mensagem clara.
- [ ] Confirmar que participante nao foi criado.

### Teste Manual - Multi-inscritos

- [ ] Criar pedido com 5 inscritos.
- [ ] Misturar categorias 4KM/10KM e cidadao/policial.
- [ ] Confirmar total correto.
- [ ] Confirmar incremento de vagas por categoria correta.
- [ ] Confirmar e-mail com todos os inscritos.

### Teste Manual - Admin

- [ ] Login admin valido.
- [ ] Login admin invalido.
- [ ] Dashboard carrega.
- [ ] Lista participantes.
- [ ] Filtros funcionam.
- [ ] Exportacao funciona.
- [ ] Detalhe abre.
- [ ] Edicao salva e registra log.
- [ ] Importacao de numeros funciona.
- [ ] Check-in por numero de peito funciona.
- [ ] Check-in duplicado e bloqueado.
- [ ] Logout limpa cookie.

### Testes Automatizados Recomendados

- [ ] Unitario: validacao de CPF.
- [ ] Unitario: calculo de preco policial/cidadao.
- [ ] Unitario: geracao de `numeroPedido`.
- [ ] Unitario: schema de consulta de inscricao.
- [ ] Integracao: criar pedido PIX.
- [ ] Integracao: webhook aprovado.
- [ ] Integracao: webhook duplicado.
- [ ] Integracao: cartao aprovado.
- [ ] Integracao: cartao recusado.
- [ ] Integracao: cron de expiracao.
- [ ] Integracao: controle de vaga concorrente.
- [ ] E2E: fluxo PIX completo com mocks.
- [ ] E2E: fluxo cartao completo com mocks.
- [ ] E2E: consulta por `numeroPedido` + e-mail.

---

## Ordem Recomendada de Execucao

1. Implementar `numeroPedido`.
2. Criar consulta publica por `numeroPedido` + e-mail.
3. Ajustar seed/lotes/precos conforme PRD.
4. Corrigir controle transacional de vagas.
5. Validar Mercado Pago PIX e cartao em sandbox.
6. Completar e-mail com `numeroPedido` e link de consulta.
7. Implementar detalhe/edicao/exportacao no admin.
8. Implementar estoque de camisetas.
9. Implementar gestao de lotes.
10. Ajustar check-in e importacao conforme PRD.
11. Criar testes automatizados dos fluxos criticos.
12. Rodar teste E2E final em sandbox antes do deploy.

---

## Definition of Done para Go-Live

- [ ] Fluxo PIX aprovado testado em sandbox.
- [ ] Fluxo cartao aprovado testado em sandbox.
- [ ] Fluxo cartao recusado testado em sandbox.
- [ ] Webhook validado com assinatura.
- [ ] Webhook duplicado nao duplica dados.
- [ ] Vagas nao ultrapassam 150 por categoria.
- [ ] `numeroPedido` aparece no e-mail e na confirmacao.
- [ ] Consulta publica por `numeroPedido` + e-mail funciona.
- [ ] Admin consegue listar, filtrar, exportar e consultar participantes.
- [ ] Admin consegue importar numero de peito.
- [ ] Admin consegue realizar check-in.
- [ ] Cron expira PIX pendente.
- [ ] Politica de reembolso e LGPD aparecem no checkout.
- [ ] Backup do banco definido.
- [ ] `pnpm typecheck` passa.
- [ ] `pnpm lint` passa.
- [ ] `pnpm build` passa.
