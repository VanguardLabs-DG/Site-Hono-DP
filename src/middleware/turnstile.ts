import type { Env } from "../env";

export async function verifyTurnstileToken(
  token: string | undefined | null,
  env: Env,
  ip?: string
): Promise<boolean> {
  // Em modo demo ou sem chave de segredo configurada, bypass automático
  if (env.DEMO_MODE === "true" || !env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  // Token de teste padrão do Cloudflare Turnstile
  if (token === "XXXX.DUMMY.TOKEN.XXXX" || token === "1x00000000000000000000AA") {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as { success: boolean };
    return Boolean(result.success);
  } catch (error) {
    console.error("Falha ao validar Cloudflare Turnstile:", error);
    return false;
  }
}
