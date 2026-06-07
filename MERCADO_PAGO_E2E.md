# Mercado Pago MCP e Plano E2E

Este guia prepara o projeto para usar o MCP oficial do Mercado Pago e testar o fluxo E2E de inscricao com PIX, cartao e webhook.

## 1. Status da Integracao Neste Ambiente

O reposititorio ja tem a configuracao MCP para Cursor em:

```text
.cursor/mcp.json
```

Configuracao:

```json
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "url": "https://mcp.mercadopago.com/mcp"
    }
  }
}
```

Importante:
- Este arquivo nao contem segredo.
- A conexao com Mercado Pago e feita por OAuth no cliente MCP/IDE.
- Neste ambiente Codex nao ha tool MCP do Mercado Pago disponivel diretamente, entao a autorizacao precisa ser feita no Cursor/cliente compatível.

## 2. Conectar o MCP no Cursor

1. Abrir o projeto no Cursor.
2. Conferir se `.cursor/mcp.json` existe.
3. Abrir `Cursor Settings > Tools & MCPs`.
4. Encontrar `mercadopago-mcp-server`.
5. Clicar em `Connect`.
6. Se aparecer `Needs authentication`, clicar nele.
7. Autorizar no Mercado Pago via OAuth.
8. Voltar ao Cursor e testar com um prompt simples:

```text
Search in Mercado Pago documentation how to configure webhooks for payments. Use language pt.
```

## 3. Tools MCP Que Vamos Usar

Prompts sugeridos para o MCP:

```text
Search in Mercado Pago documentation how to test Pix payments with Checkout API in Brazil. Use language pt.
```

```text
Show my Mercado Pago application credentials for sandbox.
```

```text
Create a Mercado Pago test user for Brazil (MLB) with seller profile, description "Corrida PC sandbox seller".
```

```text
Create a Mercado Pago test user for Brazil (MLB) with buyer profile, description "Corrida PC sandbox buyer".
```

```text
Configure Webhook notifications for payment topic with testing URL https://SEU_TUNEL/api/v1/webhook/mercadopago.
```

```text
Simulate a payment webhook notification to https://SEU_TUNEL/api/v1/webhook/mercadopago using resource_id PAYMENT_ID in sandbox.
```

```text
Show notification history diagnostics for my Mercado Pago application.
```

## 4. Arquivos de Ambiente

Criar estes arquivos localmente:

```text
apps/api/.env.local
apps/web/.env.local
apps/admin/.env.local
packages/db/.env
```

### apps/api/.env.local

```bash
DATABASE_URL="postgresql://..."
MP_ACCESS_TOKEN="TEST-..."
MP_WEBHOOK_SECRET="..."
RESEND_API_KEY="..."
EMAIL_FROM="inscricoes@seudominio.com.br"
CRON_SECRET="gere-um-segredo-longo"
ADMIN_JWT_SECRET="gere-outro-segredo-longo"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEV_PAYMENT_SIMULATION_SECRET="dev-local"
```

### apps/web/.env.local

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_MP_PUBLIC_KEY="TEST-..."
```

### apps/admin/.env.local

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
ADMIN_JWT_SECRET="mesmo-valor-de-apps-api"
```

### packages/db/.env

```bash
DATABASE_URL="postgresql://..."
```

## 5. Preparar Banco Local/Sandbox

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Se o admin ainda nao existir, rodar o seed de admin conforme documentacao do projeto.

## 6. Subir a Aplicacao

```bash
pnpm dev
```

URLs:

```text
Web:   http://localhost:3000
API:   http://localhost:3001
Admin: http://localhost:3002
```

## 7. Expor Webhook Local

O Mercado Pago precisa acessar a API local. Use um tunel HTTPS.

Exemplo com ngrok:

```bash
ngrok http 3001
```

Webhook sandbox:

```text
https://SEU_TUNEL.ngrok-free.app/api/v1/webhook/mercadopago
```

Depois, configure essa URL usando a tool MCP `save_webhook` ou pelo painel Mercado Pago.

Topico necessario:

```text
payment
```

## 8. Teste E2E PIX

### Fluxo esperado

1. Abrir `http://localhost:3000`.
2. Ir para inscricao.
3. Escolher uma categoria.
4. Preencher dados do participante.
5. Revisar pedido.
6. Escolher PIX.
7. Confirmar que a API criou um `Pedido` com:
   - `status = AGUARDANDO_PAGAMENTO`
   - `metodoPagamento = PIX`
   - `paymentId` preenchido
   - `PedidoRascunho` criado
8. Pagar o PIX no ambiente sandbox ou simular webhook com MCP.
9. Confirmar que o webhook:
   - validou assinatura;
   - buscou o pagamento no Mercado Pago;
   - criou `Participante`;
   - criou `Pagamento`;
   - mudou `Pedido.status` para `PAGO`;
   - incrementou `Categoria.vagasOcupadas`;
   - deletou `PedidoRascunho`;
   - disparou e-mail de confirmacao.
10. Confirmar que o frontend redireciona para confirmacao.

### Simular aprovacao de PIX em desenvolvimento

QR Codes PIX gerados com credenciais `TEST-...` do Mercado Pago nao devem ser pagos em aplicativo de banco real. Para testar o E2E local sem mover dinheiro, gere o PIX pela tela normal e clique em `Simular pagamento aprovado`, exibido apenas em desenvolvimento.

Alternativamente, aprove o pedido manualmente por API:

```bash
curl -i \
  -X POST \
  -H "x-dev-payment-secret: dev-local" \
  http://localhost:3001/api/v1/dev/aprovar-pix/PEDIDO_ID
```

Substitua `PEDIDO_ID` pelo id retornado no `POST /api/v1/inscricao` ou visto nos logs/status do pedido.

Resultado esperado:
- o endpoint retorna `status = PAGO`;
- o polling da tela de PIX redireciona para `/inscricao/confirmacao`;
- `Participante`, `Pagamento` e ocupacao de vaga sao persistidos;
- o e-mail de confirmacao e disparado, se o provedor de e-mail estiver configurado.

Seguranca:
- o endpoint responde `404` em `NODE_ENV=production`;
- em desenvolvimento exige o header `x-dev-payment-secret`;
- se `DEV_PAYMENT_SIMULATION_SECRET` nao estiver configurado, o valor local padrao e `dev-local`.

### Teste com pagamento real

Para pagar pelo aplicativo do banco, troque para credenciais de producao `APP_USR-...` e use uma conta Mercado Pago recebedora com Pix habilitado/chave Pix cadastrada. Nesse modo, o pagamento movimenta dinheiro real.

### Validacoes manuais

No banco:

```sql
select id, total, status, metodoPagamento, paymentId from "Pedido" order by "createdAt" desc limit 5;
select nome, email, "categoriaId", "pedidoId" from "Participante" order by "createdAt" desc limit 5;
select "pedidoId", "paymentIdGateway", valor, metodo, status from "Pagamento" order by "createdAt" desc limit 5;
```

## 9. Teste E2E Cartao

### Fluxo aprovado

1. Abrir inscricao.
2. Preencher participante.
3. Escolher cartao.
4. Usar dados de cartao de teste do Mercado Pago.
5. Confirmar pagamento.
6. Validar:
   - `Pedido.status = PAGO`;
   - `Participante` criado;
   - `Pagamento` criado;
   - vaga incrementada;
   - e-mail disparado.

Dados sugeridos:

```text
Numero: 5031 4332 1540 6351
Validade: 11/30
CVC: 123
Nome no cartao: APRO
Documento: CPF 12345678909
Parcelas: 1x
```

### Fluxo recusado

1. Criar nova inscricao com cartao.
2. Usar o mesmo cartao de teste, mas trocar o nome do titular para `OTHE`.
3. Validar:
   - mensagem amigavel no frontend;
   - nenhum participante criado;
   - pedido continua nao pago ou recebe tratamento definido;
   - vaga nao incrementa.

Outros nomes de titular uteis para teste:

```text
APRO = aprovado
OTHE = recusado por erro geral
FUND = recusado por valor insuficiente
SECU = recusado por codigo de seguranca invalido
CALL = recusado com pedido de autorizacao
CONT = pagamento pendente
```

## 9.1 Teste de E-mail

Em desenvolvimento, se `EMAIL_FROM` usar `onboarding@resend.dev`, o Resend so envia para o e-mail associado a conta Resend. Para enviar para qualquer inscrito real, configure um dominio verificado no Resend e use um remetente desse dominio:

```bash
EMAIL_FROM="inscricoes@seudominio.com.br"
```

Depois de mudar `.env.local`, reinicie `pnpm dev`.

Logs esperados na API:

```text
[email] Confirmation sent to ... emailId=...
```

Se falhar, o log deve aparecer como:

```text
[email] Failed to send confirmation for pedidoId=...
```

## 10. Teste de PIX Expirado

1. Criar inscricao PIX.
2. Nao pagar.
3. Aguardar expirar ou ajustar temporariamente o prazo em ambiente local.
4. Executar:

```bash
curl -i \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3001/api/v1/cron/expirar-pix
```

5. Validar:
   - `Pedido.status = EXPIRADO`;
   - `PedidoRascunho` removido;
   - nenhum participante criado;
   - vaga nao incrementada.

## 11. Teste Admin

1. Abrir `http://localhost:3002`.
2. Login com admin seed.
3. Ver dashboard.
4. Abrir participantes.
5. Confirmar participante pago.
6. Importar planilha de numeracao.
7. Fazer check-in por numero de peito.
8. Tentar check-in duplicado e confirmar erro.

## 12. Checklist MCP Antes do E2E

- [ ] MCP conectado no Cursor.
- [ ] OAuth autorizado no Mercado Pago.
- [ ] Credenciais sandbox obtidas.
- [ ] Usuario vendedor de teste criado.
- [ ] Usuario comprador de teste criado.
- [ ] Webhook sandbox configurado para `payment`.
- [ ] URL publica do tunel ativa.
- [ ] `apps/api/.env.local` preenchido.
- [ ] `apps/web/.env.local` preenchido.
- [ ] `apps/admin/.env.local` preenchido.
- [ ] `packages/db/.env` preenchido.
- [ ] Banco migrado e seedado.
- [ ] `pnpm dev` rodando.

## 13. Problemas Comuns

### Webhook nao chega

- Conferir se o tunel HTTPS esta ativo.
- Conferir se a URL configurada termina em `/api/v1/webhook/mercadopago`.
- Conferir se o topico `payment` esta habilitado.
- Conferir historico de notificacoes pelo MCP.

### Webhook retorna 401

- `MP_WEBHOOK_SECRET` incorreto.
- O webhook foi configurado em outra aplicacao/ambiente.
- Assinatura nao bate com o `data.id` recebido.

### PIX gera QR Code mas nao confirma

- Webhook nao configurado ou nao entregue.
- `paymentData.status` ainda nao e `approved`.
- Aplicacao usando credenciais diferentes entre API e webhook.

### Cartao nao carrega

- `NEXT_PUBLIC_MP_PUBLIC_KEY` ausente ou incorreta.
- SDK do Mercado Pago bloqueado pela rede.
- Ambiente usando chave de producao com usuarios/cartoes sandbox.

## 14. Observacao Sobre Producao

Para go-live, repetir a configuracao com credenciais de producao:

- `APP_USR-...` no `MP_ACCESS_TOKEN`.
- Public key de producao no `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- Webhook de producao configurado.
- Dominio final HTTPS.
- E-mail com SPF/DKIM/DMARC.
- Backup do banco ativo.
