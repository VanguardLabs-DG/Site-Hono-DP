export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS?: Fetcher;
  ENVIRONMENT: string;
  DEMO_MODE: string;
  JWT_SECRET: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  FIVEM_SERVER_ENDPOINT?: string;
}

export type StaffRole =
  | "player"
  | "suporte"
  | "moderador"
  | "administrador"
  | "gerente"
  | "diretor"
  | "ceo";

export interface AuthUserPayload {
  userId: string;
  displayName: string;
  email: string;
  role: StaffRole;
  avatarUrl?: string | null;
}
