"use client";

import { useState } from "react";

interface Props {
  participanteId: string;
  checkinRealizadoEm: string | null;
}

export function CheckinToggle({ participanteId, checkinRealizadoEm }: Props) {
  const [checked, setChecked] = useState(checkinRealizadoEm !== null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const novoValor = checked ? null : new Date().toISOString();

    try {
      const res = await fetch(`/api/participantes/${participanteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinRealizadoEm: novoValor }),
      });
      if (res.ok) {
        setChecked(!checked);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        disabled={loading}
        className="w-4 h-4 accent-green-600 cursor-pointer disabled:opacity-50"
      />
      <span className={`text-xs font-medium ${checked ? "text-green-700" : "text-gray-400"}`}>
        {loading ? "…" : checked ? "Feito" : "—"}
      </span>
    </label>
  );
}
