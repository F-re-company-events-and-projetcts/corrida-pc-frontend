import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  ConfirmacaoInscricao,
  type ParticipanteInfo,
} from "./templates/ConfirmacaoInscricao";

export interface SendConfirmacaoParams {
  pedidoId: string;
  participantes: ParticipanteInfo[];
  total: number;
  email: string;
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
    const from =
      process.env.EMAIL_FROM ?? "inscricoes@corridadopolicialcivil.com.br";

    const firstName = params.participantes[0]?.nome.split(" ")[0] ?? "Inscrito";
    const subject = `Inscrição confirmada — 2ª Corrida do Policial Civil • Pedido #${params.pedidoId.slice(0, 8).toUpperCase()}`;

    const html = await render(
      React.createElement(ConfirmacaoInscricao, {
        pedidoId: params.pedidoId,
        participantes: params.participantes,
        total: params.total,
      })
    );

    await resend.emails.send({
      from,
      to: params.email,
      subject,
      html,
    });

    console.log(
      `[email] Confirmation sent to ${params.email} for pedidoId=${params.pedidoId}`
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
