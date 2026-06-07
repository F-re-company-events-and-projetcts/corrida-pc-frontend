import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  ConfirmacaoInscricao,
  type ParticipanteInfo,
} from "./templates/ConfirmacaoInscricao";

export interface SendConfirmacaoParams {
  pedidoId: string;
  numeroPedido: string;
  participantes: ParticipanteInfo[];
  total: number;
  email: string;
}

function getEmailFrom() {
  const from =
    process.env.EMAIL_FROM?.trim() ??
    "inscricoes@corridadopolicialcivil.com.br";

  const plainEmailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const namedEmailPattern = /^.+\s<[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+>$/;

  if (!plainEmailPattern.test(from) && !namedEmailPattern.test(from)) {
    return {
      ok: false as const,
      error:
        "EMAIL_FROM inválido. Use email@dominio.com ou Nome <email@dominio.com>.",
    };
  }

  return { ok: true as const, from };
}

export async function sendConfirmacaoEmail(
  params: SendConfirmacaoParams
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const fromResult = getEmailFrom();
    if (!fromResult.ok) {
      console.error(`[email] ${fromResult.error}`);
      return { ok: false, error: fromResult.error };
    }

    const subject = `Inscrição confirmada — 2ª Corrida do Policial Civil • Pedido ${params.numeroPedido}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const consultaUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/consultar-inscricao?numeroPedido=${encodeURIComponent(params.numeroPedido)}`
      : undefined;

    const html = await render(
      React.createElement(ConfirmacaoInscricao, {
        numeroPedido: params.numeroPedido,
        participantes: params.participantes,
        total: params.total,
        consultaUrl,
      })
    );

    const result = await resend.emails.send({
      from: fromResult.from,
      to: params.email,
      subject,
      html,
    });

    if (result.error) {
      console.error(
        `[email] Failed to send confirmation for pedidoId=${params.pedidoId}:`,
        result.error
      );
      return { ok: false, error: result.error };
    }

    console.log(
      `[email] Confirmation sent to ${params.email} for pedidoId=${params.pedidoId} emailId=${result.data?.id ?? "unknown"}`
    );
    return { ok: true };
  } catch (error) {
    console.error(
      `[email] Failed to send confirmation for pedidoId=${params.pedidoId}:`,
      error
    );
    return { ok: false, error };
  }
}
