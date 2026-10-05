import Alpine from "./vendor/alpine.esm.js";
import { api } from "./api.js";
import { DEFAULT_RULES } from "./default-data.js";

function registerPortalApp() {
  Alpine.data("portalApp", () => ({
    // FiveM Ticker
    fivemOnline: 87,
    fivemMaxClients: 128,
    ipCopied: false,
    mobileMenuOpen: false,

    // Sessão Atual
    currentUser: null,
    isLoggedIn: false,
    authLoading: false,

    // Regras (Inicializa imediatamente com DEFAULT_RULES para exibição instantânea 100%)
    rulesList: Object.values(DEFAULT_RULES),
    currentCategory: "gerais",
    ruleSearchQuery: "",
    toastMessage: "",
    toastVisible: false,

    // Formulário de Candidatura
    appForm: {
      gameName: "",
      discordTag: "",
      age: "",
      desiredRole: "suporte",
      availability: "",
      experience: "",
      scenario1: "",
      scenario2: "",
      motivation: "",
      acceptedRules: false,
    },
    appSubmitting: false,
    appSuccessMessage: "",
    appErrorMessage: "",

    // Consulta de Inscrição
    statusSearchQuery: "",
    statusSearchResults: [],
    statusSearched: false,
    statusSearching: false,

    // Login Staff
    loginForm: {
      email: "",
      password: "",
    },
    showPassword: false,
    loginLoading: false,
    loginError: "",

    init() {
      // 1. Tenta recuperar sessão salva em cache local
      try {
        const cached = localStorage.getItem("dp_auth_user");
        if (cached) {
          this.currentUser = JSON.parse(cached);
          this.isLoggedIn = true;
        }
      } catch (e) {}

      // 2. Sincroniza em segundo plano com o backend Edge
      this.checkAuth();
      this.loadRules();
      this.loadFiveMStatus();

      // Atualiza status do FiveM a cada 15 segundos
      setInterval(() => this.loadFiveMStatus(), 15000);
    },

    showToast(msg) {
      this.toastMessage = msg;
      this.toastVisible = true;
      setTimeout(() => (this.toastVisible = false), 3000);
    },

    // 1. FiveM
    async loadFiveMStatus() {
      try {
        const data = await api.getFiveMStatus();
        if (data) {
          this.fivemOnline = data.clients ?? 87;
          this.fivemMaxClients = data.maxClients ?? 128;
        }
      } catch (e) {
        // Mantém contagem padrão
      }
    },

    copyIp() {
      navigator.clipboard.writeText("connect distritopaulistarp.fivebr.gg");
      this.ipCopied = true;
      this.showToast("Comando de conexão FiveM copiado com sucesso!");
      setTimeout(() => (this.ipCopied = false), 2500);
    },

    // 2. Autenticação & Sessão
    async checkAuth() {
      try {
        const res = await api.getMe();
        if (res && res.user) {
          this.currentUser = res.user;
          this.isLoggedIn = true;
          localStorage.setItem("dp_auth_user", JSON.stringify(res.user));
        } else {
          // Se não há cookie válido, limpa cache
          if (!this.currentUser) {
            this.isLoggedIn = false;
          }
        }
      } catch (e) {
        // Se a API retornar 401, mantém estado conforme local
      }
    },

    async handleLogin() {
      this.loginLoading = true;
      this.loginError = "";

      try {
        const res = await api.login(this.loginForm.email, this.loginForm.password);
        if (res && res.success) {
          this.currentUser = res.user;
          this.isLoggedIn = true;
          localStorage.setItem("dp_auth_user", JSON.stringify(res.user));
          window.location.href = "./dashboard.html";
        }
      } catch (err) {
        this.loginError = err.message || "Credenciais incorretas.";
      } finally {
        this.loginLoading = false;
      }
    },

    async handleDemoLogin(role) {
      this.loginLoading = true;
      this.loginError = "";

      try {
        const res = await api.demoLogin(role);
        if (res && res.success) {
          this.currentUser = res.user;
          this.isLoggedIn = true;
          localStorage.setItem("dp_auth_user", JSON.stringify(res.user));
          window.location.href = "./dashboard.html";
        }
      } catch (err) {
        this.loginError = err.message || "Erro no login de teste.";
      } finally {
        this.loginLoading = false;
      }
    },

    async handleLogout() {
      try {
        await api.logout();
      } catch (e) {}
      this.currentUser = null;
      this.isLoggedIn = false;
      localStorage.removeItem("dp_auth_user");
    },

    // 3. Regras Oficiais
    async loadRules() {
      try {
        const data = await api.getRules();
        if (data && Array.isArray(data) && data.length > 0) {
          this.rulesList = data;
        }
      } catch (e) {
        // Mantém DEFAULT_RULES já carregadas no topo
      }
    },

    get activeRule() {
      const found = this.rulesList.find((r) => r.category === this.currentCategory);
      if (found) return found;
      return DEFAULT_RULES[this.currentCategory] || {
        category: this.currentCategory,
        title: "Regras Oficiais",
        content: "",
      };
    },

    get activeRuleLines() {
      const content = String(this.activeRule?.content || "");
      return content.split("\n").map((l) => l.trim()).filter(Boolean);
    },

    get filteredRules() {
      const lines = this.activeRuleLines;
      const q = this.ruleSearchQuery.trim().toLowerCase();

      if (!q) {
        return lines.map((text, idx) => ({
          number: (idx + 1).toString().padStart(2, "0"),
          text,
          raw: text,
        }));
      }

      return lines
        .filter((text) => text.toLowerCase().includes(q))
        .map((text, idx) => ({
          number: (idx + 1).toString().padStart(2, "0"),
          text,
          raw: text,
        }));
    },

    getRuleCount(cat) {
      const found = this.rulesList.find((r) => r.category === cat) || DEFAULT_RULES[cat];
      if (!found || !found.content) return 0;
      return found.content.split("\n").map((l) => l.trim()).filter(Boolean).length;
    },

    copyRule(rawText) {
      navigator.clipboard.writeText(rawText);
      this.showToast("Regra copiada para a área de transferência!");
    },

    copyAllCurrentCategory() {
      const content = this.activeRule?.content || "";
      navigator.clipboard.writeText(content);
      this.showToast(`Todas as regras de ${this.activeRule.title} copiadas!`);
    },

    // 4. Candidaturas
    async submitApplication() {
      this.appSuccessMessage = "";
      this.appErrorMessage = "";

      if (!this.appForm.acceptedRules) {
        this.appErrorMessage = "Você deve concordar com as regras da cidade para enviar sua inscrição.";
        return;
      }

      this.appSubmitting = true;

      try {
        const payload = {
          gameName: this.appForm.gameName,
          discordTag: this.appForm.discordTag,
          age: this.appForm.age,
          desiredRole: this.appForm.desiredRole,
          availability: this.appForm.availability,
          experience: this.appForm.experience,
          scenario1: this.appForm.scenario1,
          scenario2: this.appForm.scenario2,
          motivation: this.appForm.motivation,
          turnstileToken: "1x00000000000000000000AA",
        };

        const res = await api.submitApplication(payload);
        this.appSuccessMessage = res.message || "Candidatura enviada com sucesso!";

        // Reset
        this.appForm = {
          gameName: "",
          discordTag: "",
          age: "",
          desiredRole: "suporte",
          availability: "",
          experience: "",
          scenario1: "",
          scenario2: "",
          motivation: "",
          acceptedRules: false,
        };
      } catch (err) {
        this.appErrorMessage = err.message || "Erro ao enviar candidatura.";
      } finally {
        this.appSubmitting = false;
      }
    },

    // 5. Consulta de Status
    async checkStatus() {
      if (!this.statusSearchQuery || this.statusSearchQuery.trim().length < 2) {
        return;
      }

      this.statusSearching = true;
      this.statusSearched = true;

      try {
        const results = await api.checkApplicationStatus(this.statusSearchQuery);
        this.statusSearchResults = results || [];
      } catch (err) {
        console.error(err);
        this.statusSearchResults = [];
      } finally {
        this.statusSearching = false;
      }
    },

    getStatusBadge(status) {
      switch (status) {
        case "approved":
          return { label: "Aprovado para Entrevista", class: "status-approved" };
        case "rejected":
          return { label: "Recusado", class: "status-rejected" };
        case "reviewing":
          return { label: "Em Análise", class: "status-reviewing" };
        default:
          return { label: "Pendente", class: "status-pending" };
      }
    },
  }));
}

registerPortalApp();
window.Alpine = Alpine;
Alpine.start();
