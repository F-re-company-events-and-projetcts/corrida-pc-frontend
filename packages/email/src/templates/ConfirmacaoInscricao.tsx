import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ParticipanteInfo {
  nome: string;
  categoria: string;
  percursoKm: number;
}

export interface ConfirmacaoEmailProps {
  numeroPedido: string;
  participantes: ParticipanteInfo[];
  total: number;
  consultaUrl?: string;
}

export function ConfirmacaoInscricao({
  numeroPedido,
  participantes,
  total,
  consultaUrl,
}: ConfirmacaoEmailProps) {
  const totalFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(total);

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Inscrição confirmada! Pedido {numeroPedido}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.headerTitle}>
              2ª Corrida do Policial Civil
            </Heading>
            <Text style={styles.headerSubtitle}>
              27 de Setembro de 2026 • Coxim, MS
            </Text>
          </Section>

          {/* Confirmation */}
          <Section style={styles.section}>
            <Heading as="h2" style={styles.h2}>
              Inscrição confirmada! ✓
            </Heading>
            <Text style={styles.text}>
              Pedido <strong>{numeroPedido}</strong>
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Participants */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.h3}>
              {participantes.length === 1 ? "Inscrito" : "Inscritos"}
            </Heading>
            {participantes.map((p, i) => (
              <Section key={i} style={styles.participanteBox}>
                <Text style={styles.participanteNome}>{p.nome}</Text>
                <Text style={styles.participanteDetalhe}>
                  {p.categoria} — {p.percursoKm}KM
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={styles.hr} />

          {/* Total */}
          <Section style={styles.section}>
            <Text style={styles.text}>
              <strong>Total pago:</strong> {totalFormatado}
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Kit info */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.h3}>
              Retirada do Kit
            </Heading>
            <Text style={styles.text}>
              Kit disponível em <strong>26/Set/2026</strong> das{" "}
              <strong>08h às 18h</strong> na{" "}
              <strong>Delegacia de Polícia Civil — Coxim</strong>.
            </Text>
            <Text style={styles.text}>
              Apresente este e-mail ou o número do pedido na retirada.
            </Text>
            {consultaUrl ? (
              <Text style={styles.text}>
                Consulte o status da inscrição em{" "}
                <Link href={consultaUrl} style={styles.link}>
                  {consultaUrl}
                </Link>
              </Text>
            ) : null}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              2ª Corrida do Policial Civil — 27/Set/2026 — Coxim-MS
            </Text>
            <Text style={styles.footerText}>
              Em caso de dúvidas, entre em contato conosco.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    maxWidth: "560px",
    margin: "0 auto",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#1e3a5f",
    padding: "32px 40px 24px",
    textAlign: "center" as const,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 4px",
  },
  headerSubtitle: {
    color: "#93c5fd",
    fontSize: "14px",
    margin: 0,
  },
  section: {
    padding: "24px 40px",
  },
  h2: {
    color: "#15803d",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 8px",
  },
  h3: {
    color: "#1e3a5f",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 12px",
  },
  text: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 8px",
  },
  link: {
    color: "#1e40af",
    textDecoration: "underline",
  },
  participanteBox: {
    backgroundColor: "#f8fafc",
    borderLeft: "3px solid #1e3a5f",
    borderRadius: "4px",
    margin: "0 0 12px",
    padding: "12px 16px",
  },
  participanteNome: {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 2px",
  },
  participanteDetalhe: {
    color: "#6b7280",
    fontSize: "13px",
    margin: 0,
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "0 40px",
  },
  footer: {
    backgroundColor: "#f8fafc",
    padding: "20px 40px",
    textAlign: "center" as const,
  },
  footerText: {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "0 0 4px",
  },
};
