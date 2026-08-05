import type { Categoria } from "@corrida/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchCategorias(): Promise<Categoria[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/categorias`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
