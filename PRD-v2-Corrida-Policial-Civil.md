**PRD — Plataforma de Inscrições**

**Corrida do Policial Civil**

Versão 2.0  |  Junho 2025

*Documento de Requisitos de Produto — Confidencial*

# **0\. Metadados do Documento**

| Campo | Valor |
| :---- | :---- |
| Produto | Plataforma de Inscrições — Corrida do Policial Civil |
| Versão | 2.0 (PRD final — todas as decisões resolvidas) |
| Status | Aprovado para desenvolvimento |
| Data | Junho 2025 |
| Corrida alvo | 2ª Corrida do Policial Civil — 27/Set/2026, Coxim-MS |
| Gateway | Mercado Pago |
| Stack backend | Node.js (Next.js API Routes ou servidor dedicado) |
| Vagas totais | 600 (150 por categoria) |

# **1\. Visão do Produto**

## **1.1 Problema Real**

A Corrida do Policial Civil depende hoje de uma landing page estática para divulgação e de processos manuais (formulários externos, PIX avulso, planilhas) para inscrições. Esse modelo gera:

* Fricção para o inscrito: múltiplos passos desconexos — ver site, preencher formulário externo, fazer PIX, aguardar confirmação manual.

* Risco de sobrevenda: sem controle de vagas em tempo real, o organizador pode ultrapassar o limite de 600 inscritos.

* Trabalho operacional alto: validação de pagamentos, controle de camisetas e emissão de kits feita manualmente.

* Perda de dados: informações de participantes dispersas em fontes distintas, impossibilitando análise e reuso.

## **1.2 Públicos-Alvo**

| Persona | Perfil | Necessidade Principal |
| :---- | :---- | :---- |
| Corredor Cidadão | Adulto 15–55 anos, Coxim e região, pouca experiência digital | Inscrever-se de forma simples e receber confirmação imediata do pagamento |
| Policial / Força de Segurança | Servidor de qualquer força policial (Civil, Militar, Federal etc.) com preço fixo de R$ 80 | Fluxo sem fricção; comprovação de vínculo feita presencialmente no check-in |
| Organizador do Evento | Equipe pequena (2–4 pessoas); opera check-in presencial no dia anterior à corrida | Visibilidade em tempo real de pagamentos, camisetas e dados dos corredores; check-in com entrega de número de peito |
| Admin da Plataforma | Perfil técnico ou semi-técnico | Gerenciar lotes, exportar relatórios, importar planilha de numeração da cronometragem, corrigir dados |

## **1.3 Proposta de Valor**

* Para o inscrito: experiência fluida do clique ao kit — sem sair da página, sem incerteza sobre confirmação.

* Para o organizador: painel único com visibilidade operacional completa — pagamentos, camisetas, check-in e número de peito de cada corredor.

* Para o futuro: base de código reutilizável para próximas edições, amortizando o custo de desenvolvimento.

# **2\. Escopo do Produto**

## **2.1 MVP — Incluído**

### **Frontend**

* Landing page existente com ajustes de conteúdo (preços, categorias, datas)

* Fluxo de inscrição: seleção de categoria → formulário → revisão → checkout → confirmação

* Suporte a múltiplos inscritos por transação (até 5, categorias podem ser mistas)

* Pagamento via PIX (QR Code \+ copia-cola) e Cartão de Crédito parcelado (juros do comprador)

* E-mail de confirmação automático pós-pagamento aprovado

* Tela de status do pedido (confirmado / pendente / recusado)

### **Backend / API**

* API REST em Node.js integrada ao Mercado Pago

* Webhook de pagamento com idempotência e retry

* Worker de expiração de PIX (verificação a cada 15 min)

* Serviço de e-mail transacional (confirmação \+ lembrete PIX)

* Controle de vagas em tempo real com bloqueio ao atingir 150 por categoria

### **Painel Admin**

* Login seguro (JWT, 2FA recomendado)

* Dashboard com totalizadores: inscritos, pagos, pendentes, receita, vagas restantes

* Lista de participantes com filtros por categoria, status de pagamento e tamanho de camiseta

* Busca por CPF, nome ou e-mail

* Detalhe e edição do participante

* Alteração manual de status de pagamento com log de auditoria

* Gestão de estoque de camisetas por tamanho

* Gestão de lotes (ativar/desativar, editar datas e preços de cidadão)

* Exportação CSV e XLSX

* Check-in presencial: marcar corredor como presente, confirmar dados, registrar tamanho de camiseta, emitir número de peito

* Importação de planilha de numeração da empresa de cronometragem (vincula número de peito ao corredor)

## **2.2 Fora do MVP — Explicitamente Excluído**

| ⛔  Não entra no MVP Área do participante (login próprio) | App móvel nativo | Integração com sistema de cronometragem em tempo real | Certificado digital pós-prova | Ranking/resultados | Reembolso automatizado | Múltiplos eventos simultâneos | Plataforma multi-tenant |
| :---- |

## **2.3 Horizonte 2 — Plataforma Reutilizável**

| 🔮  Pós-MVP — Próximas Edições O código será estruturado para facilitar reuso em edições futuras: categorias e lotes configuráveis via admin, múltiplas edições de evento, painel financeiro consolidado. Nenhum desses pontos entra no escopo atual. |
| :---- |

# **3\. Regras de Negócio**

## **3.1 Categorias e Percursos**

| Categoria | Percurso | Público | Vagas |
| :---- | :---- | :---- | :---- |
| 4KM Cidadão | 4 km | Público geral (15+ anos) | 150 |
| 4KM Policial | 4 km | Qualquer força de segurança pública | 150 |
| 10KM Cidadão | 10 km | Público geral (15+ anos) | 150 |
| 10KM Policial | 10 km | Qualquer força de segurança pública | 150 |

**Total geral: 600 vagas. Sistema bloqueia inscrição ao atingir 150 por categoria.**

## **3.2 Lotes e Preços**

| Lote | Preço Cidadão (+ taxas do site) | Preço Policial | Prazo |
| :---- | :---- | :---- | :---- |
| Lote Promocional | R$ 80,00 | R$ 80,00 (fixo) | Encerrado |
| 1º Lote | R$ 85,00 | R$ 80,00 (fixo) | A definir |
| 2º Lote | R$ 90,00 | R$ 80,00 (fixo) | A definir |

* O preço policial é fixo em R$ 80,00 em todos os lotes — independente de qual lote está ativo para o cidadão.

* As taxas do site (Mercado Pago) são repassadas ao comprador e exibidas no checkout.

* Lote ativo é determinado pela data atual vs. prazo do lote. Lote esgotado (vagas da categoria zeradas) bloqueia o CTA imediatamente.

* Somente o preço de cidadão sobe entre lotes. A lógica de preço policial não é percentual — é valor fixo.

## **3.3 Inscrição em Lote (Múltiplos Inscritos)**

* Uma transação pode conter até 5 inscritos.

* Cada inscrito escolhe sua própria categoria (pode misturar cidadão e policial, 4KM e 10KM).

* O valor total é a soma das inscrições individuais. Cada inscrição desconta 1 vaga da categoria correspondente.

* CPF deve ser único por inscrição — não é permitido o mesmo CPF duas vezes na mesma transação.

## **3.4 Validação de Categoria Policial**

* No fluxo digital: autodeclaração. O inscrito seleciona a categoria policial e aceita termo de responsabilidade. Nenhum documento é solicitado no momento da inscrição.

* Validação presencial: feita no check-in (dia anterior à corrida). O organizador confere o vínculo funcional.

* Se o corredor não comprovar vínculo no check-in: paga a diferença de preço no local ou não participa, conforme regulamento do evento. O sistema não processa esse fluxo — é operacional/presencial.

## **3.5 Política de Reembolso**

* Não há reembolso por desistência do inscrito.

* Em caso de cancelamento do evento pelo organizador, o reembolso é integral — processado manualmente via Mercado Pago pelo admin.

* O sistema exibe essa política no checkout (antes do pagamento) e no regulamento vinculado.

## **3.6 Inscrição Não Finalizada (PIX não pago)**

* Enquanto o PIX não for confirmado, nenhum dado do inscrito é persistido no banco de dados. A vaga não é reservada.

* O QR Code do PIX expira em 30 minutos. Após expiração, o usuário pode iniciar nova inscrição.

* Para Cartão: a confirmação é imediata. Em caso de recusa, o usuário pode tentar outro cartão ou mudar para PIX.

## **3.7 Numeração de Peito (Check-in)**

* A empresa de cronometragem fornece planilha com intervalos de números de peito por categoria.

* O admin importa essa planilha via painel — o sistema vincula automaticamente os números aos corredores de cada categoria.

* No check-in, o organizador confirma os dados do corredor e entrega o número de peito já associado ao perfil.

* O número de peito é exibido no detalhe do participante no admin após a importação.

# **4\. Jornada do Usuário**

## **4.1 Fluxo de Inscrição — Passo a Passo**

| Etapa | Ação do Usuário | Comportamento do Sistema |
| :---- | :---- | :---- |
| 1\. Landing Page | Acessa o site via redes sociais ou WhatsApp | Exibe seções: hero, countdown, percursos, preços por lote, informações. CTA 'Inscreva-se' leva ao fluxo de inscrição. |
| 2\. Seleção de Categoria | Escolhe 4KM ou 10KM / Cidadão ou Policial | Exibe preço conforme lote ativo. Se categoria esgotada, botão desabilitado. Policial exibe aviso de autodeclaração. |
| 3\. Formulário | Preenche dados pessoais | Campos: nome completo, CPF, data de nascimento, telefone, e-mail, contato de emergência, tamanho de camiseta. CPF validado (formato \+ dígito). E-mail e telefone validados. |
| 4\. Inscrição adicional | (Opcional) Adiciona outro inscrito | Repete o formulário para cada inscrito adicional. Cada um escolhe sua categoria. Máximo 5 inscritos por transação. |
| 5\. Revisão do Pedido | Confere resumo antes de pagar | Exibe: lista de inscritos, categorias, valores individuais, total, método de pagamento. Permite editar qualquer campo antes de confirmar. |
| 6\. Aceite de Termos | Marca checkbox de aceite | Exibe link para regulamento (abre em nova aba). Aceite obrigatório para prosseguir. Policial vê termo adicional de autodeclaração. |
| 7\. Pagamento — PIX | Escaneia QR ou copia código | QR Code gerado via Mercado Pago. Expiração em 30 min. Tela aguarda webhook em polling. Ao confirmar, avança automaticamente. |
| 7\. Pagamento — Cartão | Digita dados do cartão | SDK do Mercado Pago tokeniza no navegador. Parcelamento disponível (juros do comprador). Confirmação imediata. |
| 8\. Confirmação | Vê tela de confirmação | Exibe resumo do pedido, número do pedido, instrução de retirada de kit. E-mail de confirmação enviado automaticamente. |

## **4.2 Fluxo Admin — Check-in Presencial**

1. Login no painel admin com e-mail e senha.

2. Acessar módulo 'Check-in'. Buscar corredor por CPF, nome ou número de peito.

3. Confirmar dados: categoria, tamanho de camiseta. Corrigir se necessário.

4. Registrar presença — status do corredor muda para 'Check-in realizado'.

5. Entregar número de peito (exibido na tela após importação da planilha de cronometragem).

6. (Policial) Verificar comprovante de vínculo funcional presencialmente.

# **5\. Requisitos Funcionais**

## **5.1 Landing Page**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| LP-01 | Exibir contagem regressiva para 27/Set/2026 | Must |
| LP-02 | Exibir categorias e preços com lote ativo destacado (dados vindos da API) | Must |
| LP-03 | Bloquear CTA de inscrição ao esgotar vagas da categoria | Must |
| LP-04 | Exibir percursos 4KM e 10KM com mapas Strava | Should |
| LP-05 | Galeria de fotos de edições anteriores | Should |
| LP-06 | Seção de informações: entrega de kit (26/Set), largada e premiação | Must |
| LP-07 | Footer com contatos e redes sociais | Should |
| LP-08 | SEO básico: meta tags, og:image, título de página | Should |

## **5.2 Inscrição**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| INS-01 | Seleção de categoria com preço dinâmico conforme lote ativo da API | Must |
| INS-02 | Formulário: nome, CPF, nascimento, telefone, e-mail, contato emergência, tamanho camiseta | Must |
| INS-03 | Validação de CPF (formato \+ dígito verificador) no frontend | Must |
| INS-04 | Validação de e-mail e telefone no frontend | Must |
| INS-05 | Suporte a múltiplos inscritos (até 5\) por transação com categorias mistas | Must |
| INS-06 | Seletor de categoria individual por inscrito adicional | Must |
| INS-07 | Checkbox de aceite de regulamento (obrigatório) \+ termo policial (se aplicável) | Must |
| INS-08 | Tela de revisão do pedido antes do pagamento com edição de campos | Must |
| INS-09 | Indicador de progresso (step bar) no fluxo | Should |
| INS-10 | Verificação de CPF duplicado dentro da mesma transação | Must |
| INS-11 | Bloqueio de inscrição se categoria atingiu 150 vagas (verificado na API) | Must |

## **5.3 Pagamento**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| PAG-01 | PIX com QR Code gerado via API do Mercado Pago \+ código copia-cola | Must |
| PAG-02 | Cartão de crédito com parcelamento (juros do comprador, conforme tabela do Mercado Pago) | Must |
| PAG-03 | PIX expira em 30 minutos — após expiração, inscrição descartada e vagas liberadas | Must |
| PAG-04 | Dados de inscrição persistidos SOMENTE após confirmação de pagamento via webhook | Must |
| PAG-05 | Webhook do Mercado Pago processado com idempotência (payment\_id único no banco) | Must |
| PAG-06 | Retry de webhook: reprocessamento automático em caso de falha | Must |
| PAG-07 | Tela de status em polling: confirmado / pendente / recusado / expirado | Must |
| PAG-08 | E-mail automático de confirmação após pagamento aprovado | Must |
| PAG-09 | E-mail de lembrete para PIX pendente (15 min antes de expirar) | Should |
| PAG-10 | Tokenização de cartão via SDK do Mercado Pago — nenhum dado de cartão no backend | Must |
| PAG-11 | Rate limiting: máximo 10 tentativas de inscrição por IP por minuto | Must |

## **5.4 Pós-Pagamento**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| POS-01 | Página de confirmação com resumo do pedido e número do pedido | Must |
| POS-02 | E-mail de confirmação com dados do participante, categoria e instruções de retirada de kit | Must |
| POS-03 | Link de consulta de status do pedido via número do pedido (sem login) | Should |
| POS-04 | Cancelamento de inscrição pelo admin com registro em log | Should |

## **5.5 Painel Admin — Gestão**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| ADM-01 | Login com e-mail/senha \+ sessão JWT | Must |
| ADM-02 | Dashboard: inscritos totais, pagos, pendentes, receita, vagas restantes por categoria | Must |
| ADM-03 | Lista de participantes com filtros: categoria, status pagamento, tamanho camiseta | Must |
| ADM-04 | Busca por CPF, nome ou e-mail | Must |
| ADM-05 | Detalhe do participante: todos os campos do formulário \+ histórico de pagamento | Must |
| ADM-06 | Edição de dados do participante pelo admin | Must |
| ADM-07 | Alteração manual de status de pagamento com log de auditoria (quem alterou, quando, motivo) | Must |
| ADM-08 | Exportação de lista em CSV e XLSX | Must |
| ADM-09 | Controle de estoque de camisetas: total comprometido vs. disponível por tamanho | Must |
| ADM-10 | Gestão de lotes: ativar/desativar lote, editar datas e preços de cidadão | Should |
| ADM-11 | Perfis de acesso: admin total vs. operacional (somente leitura \+ check-in) | Could |

## **5.6 Painel Admin — Check-in**

| ID | Requisito | Prioridade |
| :---- | :---- | :---- |
| CHK-01 | Módulo de check-in: busca de corredor por CPF, nome ou número de peito | Must |
| CHK-02 | Exibição de dados do corredor: nome, categoria, camiseta, status de pagamento | Must |
| CHK-03 | Ação de registrar check-in — muda status para 'Check-in realizado' | Must |
| CHK-04 | Confirmação e edição de tamanho de camiseta no momento do check-in | Must |
| CHK-05 | Exibição do número de peito (após importação da planilha) | Must |
| CHK-06 | Importação de planilha XLSX/CSV da empresa de cronometragem (colunas: número\_peito, categoria) | Must |
| CHK-07 | Vinculação automática: número de peito → corredor, por categoria e ordem de inscrição | Must |
| CHK-08 | Listagem de corredores sem número de peito atribuído (para validação pós-importação) | Should |

# **6\. Requisitos Não Funcionais**

## **6.1 Performance**

* LCP (Largest Contentful Paint) \< 2,5s em conexão 4G — público regional com rede instável.

* Cada etapa do fluxo de inscrição renderiza em \< 1,5s após interação do usuário.

* Webhook de pagamento processado em \< 5s após recebimento.

* Dashboard admin carrega lista completa em \< 3s para até 600 participantes.

## **6.2 Segurança**

* Nenhum dado de cartão trafega pelo backend próprio — tokenização exclusiva via SDK do Mercado Pago.

* HTTPS obrigatório em toda a aplicação.

* CPF armazenado com hashing ou criptografia em repouso.

* Rate limiting no endpoint de criação de inscrição (10 req/min por IP).

* Proteção contra CSRF e XSS no formulário.

* Tokens JWT com expiração de 8h \+ refresh token com rotação.

* Webhook do Mercado Pago validado por assinatura (X-Signature).

## **6.3 Escalabilidade**

* MVP: suportar 600 inscrições com picos de 50 req/s na abertura de lotes.

* Banco de dados com índices em: cpf, email, status\_pagamento, categoria\_id, payment\_id.

* Arquitetura stateless no backend — permite escalonamento horizontal sem refatoração.

## **6.4 Disponibilidade**

* Uptime de 99,5% durante o período de inscrições abertas.

* Endpoint de webhook isolado do restante da aplicação — indisponibilidade de admin não afeta processamento de pagamentos.

* Backup automático do banco de dados diariamente \+ exportação manual pelo admin antes do evento.

## **6.5 Conformidade**

* LGPD: consentimento explícito na coleta de dados pessoais; política de privacidade vinculada no formulário.

* Menores de 18 anos (a partir de 15): o campo de data de nascimento deve exibir aviso sobre necessidade de autorização do responsável (verificação presencial no check-in).

* Nenhum CVV ou número completo de cartão armazenado em qualquer momento.

# **7\. Integração com Mercado Pago**

## **7.1 Gateway Definido: Mercado Pago**

| ✅  Decisão tomada: Mercado Pago Reconhecimento de marca alto (reduz desconfiança do usuário), suporte nativo a PIX e Cartão, SDK de tokenização para frontend, webhook robusto. Conta PJ do organizador deve ser criada antes do início do desenvolvimento. |
| :---- |

## **7.2 Fluxo PIX**

7. Frontend submete dados de inscrição ao backend (sem persistência ainda).

8. Backend chama POST /v1/payments no Mercado Pago com método 'pix'.

9. Mercado Pago retorna QR code, código copia-cola e payment\_id. Backend retorna ao frontend.

10. Frontend exibe QR code. Inicia polling no endpoint /api/payment/{id}/status a cada 3s.

11. Mercado Pago dispara webhook ao confirmar pagamento. Backend valida assinatura X-Signature.

12. Backend verifica idempotência (payment\_id já processado?). Se não, persiste inscrito(s) e atualiza status.

13. Backend dispara e-mail de confirmação. Frontend detecta status 'pago' via polling e avança para confirmação.

14. PIX não pago após 30 min: webhook de expiração \+ worker agendado (a cada 15 min) limpam registros temporários.

## **7.3 Fluxo Cartão**

15. Frontend usa SDK do Mercado Pago (MercadoPago.js) para tokenizar o cartão no navegador.

16. Frontend envia token \+ dados de inscrição ao backend.

17. Backend chama POST /v1/payments com o token e dados do pagador.

18. Mercado Pago retorna aprovado/recusado. Backend persiste inscrito(s) somente se aprovado.

19. Backend dispara e-mail de confirmação. Frontend exibe resultado imediatamente.

## **7.4 Parcelamento**

* Juros do parcelamento são inteiramente do comprador (absorvidos pelo Mercado Pago na cobrança).

* O organizador recebe sempre o valor cheio. O frontend exibe a tabela de parcelas com juros antes da confirmação.

* Configuração de número máximo de parcelas a definir com o organizador (sugestão: até 6x).

## **7.5 Riscos de Pagamento**

| Risco | Prob. | Impacto | Mitigação |
| :---- | :---- | :---- | :---- |
| Webhook duplicado (double credit) | Baixa | Alto | Índice UNIQUE em payment\_id — segundo processamento é ignorado |
| PIX expirado com vaga não liberada | Média | Médio | Worker a cada 15 min verifica inscrições temporárias expiradas e descarta |
| Cartão recusado sem feedback claro | Média | Médio | Exibir mensagem do Mercado Pago \+ oferecer PIX como alternativa |
| Indisponibilidade do Mercado Pago | Baixa | Alto | Circuit breaker \+ página de fallback com orientação ao usuário |
| Valor do PIX divergente do pedido | Baixa | Médio | Webhook valida payment.transaction\_amount vs. valor esperado antes de confirmar |

# **8\. Modelo de Dados — Entidades Principais**

| Entidade | Campos Principais | Observações |
| :---- | :---- | :---- |
| participante | id, nome, cpf (hash), data\_nascimento, telefone, email, contato\_emergencia, tamanho\_camiseta, categoria\_id, inscricao\_id, numero\_peito, checkin\_realizado\_em | 1 participante por inscrição individual; múltiplos participantes por pedido |
| pedido | id, total, status (aguardando/pago/recusado/expirado), metodo\_pagamento, criado\_em, pago\_em, payment\_id\_gateway | Agrupa 1 a 5 participantes |
| pagamento | id, pedido\_id, payment\_id (Mercado Pago), valor, metodo, status, webhook\_recebido\_em | Idempotência via payment\_id |
| categoria | id, nome, percurso\_km, tipo (cidadao/policial), preco\_fixo (policial), vagas\_total, vagas\_ocupadas | 4 categorias fixas para esta edição |
| lote | id, nome, preco\_cidadao, ativo, data\_inicio, data\_fim | Preço policial sempre R$ 80 — não depende do lote |
| camiseta\_estoque | id, tamanho (PP/P/M/G/GG/XGG), quantidade\_total, quantidade\_comprometida | Atualizado a cada inscrição confirmada |
| admin\_log | id, admin\_id, acao, entidade, entidade\_id, valor\_anterior, valor\_novo, criado\_em | Auditoria de alterações manuais |

# **9\. Métricas de Sucesso**

## **9.1 Métricas de Negócio**

| Métrica | Meta | Como Medir |
| :---- | :---- | :---- |
| Taxa de conversão (visita → inscrição paga) | \> 15% | Sessões na LP vs. pedidos com status pago |
| Taxa de abandono no checkout | \< 30% | Pedidos iniciados vs. pagos |
| Taxa de PIX expirado sem pagamento | \< 20% | Pedidos com status expirado |
| Receita total arrecadada | 100% do esperado | Relatório financeiro do admin |
| Tempo de confirmação pós-pagamento | \< 2 minutos | Timestamp webhook vs. e-mail enviado |
| Corredores com check-in realizado no dia | \> 90% dos inscritos pagos | Módulo de check-in do admin |

## **9.2 Métricas de Produto**

| Métrica | Meta |
| :---- | :---- |
| LCP na landing page mobile | \< 2,5s |
| Tempo médio de conclusão do formulário | \< 4 minutos |
| Taxa de erro de campo no formulário | \< 5% das submissões |
| Tickets de suporte por inscrição problemática | \< 2% do total |
| Numeração de peito importada sem conflito | 100% dos 600 corredores atribuídos |

# **10\. Riscos e Assunções**

## **10.1 Riscos**

| Risco | Prob. | Impacto | Ação |
| :---- | :---- | :---- | :---- |
| Conta Mercado Pago não criada antes do dev de pagamento — aprovação leva dias | Alta | Alto | Criar conta PJ imediatamente — ação fora do desenvolvimento |
| Inscrições em lote aumentam complexidade de testes | Alta | Médio | Limitar a 5 por transação; testar todos os cenários de mescla de categoria |
| E-mails de confirmação caindo em spam | Média | Alto | Configurar SPF, DKIM, DMARC no domínio do evento |
| Planilha de cronometragem em formato inesperado | Média | Médio | Definir template de planilha acordado com a empresa de cronometragem antes do go-live |
| Banco de dados sem backup antes da corrida | Baixa | Crítico | Backup diário automático \+ exportação manual pelo admin 48h antes do evento |
| Pico de acessos na abertura de lote | Média | Alto | Teste de carga na Fase 3; endpoint de inscrição com rate limiting e fila |

## **10.2 Assunções**

* O organizador possui conta PJ no Mercado Pago (ou abrirá antes do desenvolvimento de pagamento).

* A corrida ocorrerá em 27/Set/2026 — cancelamento requer reembolso manual pelo organizador.

* O limite de 600 vagas (150 por categoria) é fixo para esta edição.

* Não haverá integração em tempo real com sistema de cronometragem — apenas importação prévia de planilha.

* A empresa de cronometragem entregará a planilha de numeração com antecedência mínima de 48h antes do check-in.

* Menores de 15 anos não participam — faixa etária mínima é 15 anos.

* 'Meia' foi removida do escopo — não será vendida nesta edição.

# **11\. Análise do Código Existente**

## **11.1 Reuso**

| Componente | Status | Decisão |
| :---- | :---- | :---- |
| Sistema de design atoms/ (Button, Input, Card, Typography, Badge, Checkbox, Separator) | Completo e bem estruturado | Reuso total — base do fluxo de inscrição e admin |
| Landing page (Hero, Header, Footer, Countdown, RaceInfo, HistoryGallery) | Funcionais | Reuso com ajuste de conteúdo — preços e categorias virão da API |
| Registration.tsx — cards de modalidade | Funcional (UI) | Adaptar para iniciar fluxo de inscrição real em rota dedicada /inscricao |
| PricingCard molecule | Completo | Reuso na seleção de categoria |
| Routes.tsx — mapas Strava | Funcional | Manter — embeds já configurados para os percursos reais |
| mocks/landing-page-data.ts | Dados hardcoded | Remover após API de categorias e lotes estar disponível |

## **11.2 Inconsistências Resolvidas**

| Item | Decisão Final |
| :---- | :---- |
| Distância da categoria avançada | 10KM — código Registration.tsx está correto. Atualizar landing-page-data.ts de 8KM para 10KM. |
| Preços dos lotes | R$ 80 / R$ 85 / R$ 90 (cidadão). R$ 80 fixo (policial). Remover hardcode — virão da API. |
| Regra de desconto policial | Preço fixo R$ 80 em todos os lotes. Não é percentual. Lógica simples: if (policial) preco \= 80\. |
| Categoria policial — percurso exclusivo? | Não. Mesmo percurso do cidadão. Diferença é apenas preço e validação de vínculo. |

## **11.3 Ajustes Técnicos Necessários**

* Criar rota dedicada /inscricao em vez de modal inline — melhor UX para múltiplos inscritos e navegação por etapas.

* Toda lógica de preço, lotes e vagas deve vir de endpoints da API — nunca hardcoded no frontend.

* Consolidar duplicação de componentes: atoms/ como wrapper dos ui/ (shadcn). Já parcialmente feito — manter convenção.

* Backend será construído do zero — nenhuma API existe no repositório atual.

# **12\. Roadmap de Desenvolvimento**

## **Fase 0 — Fundação (Semanas 1–2)**

* Criar conta PJ no Mercado Pago e configurar credenciais de sandbox.

* Definir estrutura do monorepo (frontend Next.js \+ backend API Routes ou servidor Node dedicado).

* Implementar modelo de dados no banco (conforme Seção 8).

* Corrigir inconsistências do código frontend (Seção 11.2).

* Substituir hardcodes de preço/categoria por chamadas de API (endpoints mock inicialmente).

## **Fase 1 — MVP Core (Semanas 3–8)**

* Backend: CRUD de categorias, lotes, participantes e pedidos.

* Backend: integração Mercado Pago — PIX e Cartão.

* Backend: webhook \+ worker de expiração de PIX.

* Backend: serviço de e-mail transacional (confirmação \+ lembrete PIX).

* Frontend: fluxo completo de inscrição multi-step (/inscricao).

* Frontend: tela de revisão, aceite de termos, checkout e confirmação.

* Admin: autenticação \+ lista de participantes \+ filtros básicos.

## **Fase 2 — Admin Completo (Semanas 9–11)**

* Dashboard com totalizadores e vagas restantes por categoria.

* Filtros avançados, busca e exportação CSV/XLSX.

* Controle de camisetas e gestão de lotes.

* Módulo de check-in presencial (busca, confirmação, registro de presença).

* Importação de planilha de numeração de peito \+ vinculação automática.

## **Fase 3 — QA e Estabilização (Semanas 12–13)**

* Testes de carga — simular abertura de lote com pico de acessos.

* Testes de pagamento end-to-end em sandbox → ambiente de produção.

* Teste de importação de planilha de cronometragem com dados reais.

* Configuração de monitoramento, alertas e backup automático.

* Treinamento do time do organizador no painel admin e módulo de check-in.

## **Fase 4 — Go-Live (Semana 14\)**

* Abertura das inscrições para o público.

* Monitoramento ativo nas primeiras 48h.

* Suporte direto ao organizador durante os primeiros dias.

*PRD v2.0 — Corrida do Policial Civil — Confidencial — Todas as decisões de produto resolvidas*