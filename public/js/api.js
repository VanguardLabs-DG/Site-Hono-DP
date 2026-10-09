/**
 * Distrito Paulista RP — Cliente de API Hono Edge
 * Comunicação direta com os endpoints do Cloudflare Worker (/api/*)
 */
const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: "include", // Garante envio e recepção de cookies HttpOnly
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Erro HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Saúde, FiveM & Discord
  getHealth: () => request("/health"),
  getFiveMStatus: () => request("/fivem-status"),
  getDiscordStatus: () => request("/discord-status"),

  // Autenticação & Sessão
  login: (email, password, turnstileToken = "") =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, turnstileToken }),
    }),

  demoLogin: (role) =>
    request("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  getMe: () => request("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  // Regras Oficiais
  getRules: () => request("/rules"),
  updateRule: (category, { title, content }) =>
    request(`/rules/${category}`, {
      method: "PUT",
      body: JSON.stringify({ title, content }),
    }),

  // Candidaturas Staff
  submitApplication: (data) =>
    request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkApplicationStatus: (query) =>
    request(`/applications/status?q=${encodeURIComponent(query)}`),

  getApplications: () => request("/applications"),

  updateApplication: (id, { status, reviewerNotes }) =>
    request(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, reviewerNotes }),
    }),

  deleteApplication: (id) =>
    request(`/applications/${id}`, {
      method: "DELETE",
    }),

  // Gestão Administrativa (Staff)
  getUsers: () => request("/admin/users"),

  createUser: (data) =>
    request("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  updateUserStatus: (id, status) =>
    request(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  deleteUser: (id) =>
    request(`/admin/users/${id}`, {
      method: "DELETE",
    }),

  // Matriz de Permissões (RBAC CEO)
  getPermissions: () => request("/admin/permissions"),

  updatePermission: (permissionKey, role, allowed) =>
    request("/admin/permissions", {
      method: "PUT",
      body: JSON.stringify({ permissionKey, role, allowed }),
    }),

  // Auditoria
  getAuditLogs: () => request("/admin/audit"),
  clearAuditLogs: () =>
    request("/admin/audit", {
      method: "DELETE",
    }),
};
