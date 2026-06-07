import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getKey(): Buffer {
  const secret = process.env.ADMIN_JWT_SECRET ?? "corrida-pc-default-key-2026!!";
  // Derive 32-byte key from the secret using SHA-256
  return createHash("sha256").update(secret).digest();
}

export function criptografarCpf(cpf: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(cpf.replace(/\D/g, ""), "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function descriptografarCpf(valor: string): string | null {
  try {
    const key = getKey();
    const [ivHex, dataHex] = valor.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const data = Buffer.from(dataHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    const cpf = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    // Format: 000.000.000-00
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } catch {
    return null;
  }
}
