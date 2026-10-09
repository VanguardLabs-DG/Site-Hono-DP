import Alpine from "./vendor/alpine.esm.js";
import Swup from "./vendor/swup.esm.js";
import { api } from "./api.js";
import { DEFAULT_RULES, STRUCTURED_PENAL_CODE } from "./default-data.js";

function registerPortalApp() {
  Alpine.data("portalApp", () => ({
    // FiveM Status & Conexão (Dados Reais)
    fivemOnline: 0,
    fivemMaxClients: 128,
    fivemIsOnline: true,
    fivemServerName: "DISTRITO PAULISTA",
    fivemPing: 0,
    fivemLoaded: false,
    ipCopied: false,
    mobileMenuOpen: false,

    // Discord Status (Dados Reais /drpd)
    discordOnline: 0,
    discordMembers: 0,
    discordGuildName: "Darkness Clan",
    discordInviteCode: "drpd",
    discordLoaded: false,

    // Modais
    recruitModalOpen: false,
    recruitTab: "apply", // 'apply' | 'status'
    recruitStep: 1, // 1 | 2 | 3
    staffLoginModalOpen: false,
    showDemoDrawer: false,

    // Sessão Atual
    currentUser: null,
    isLoggedIn: false,
    authLoading: false,

    // Regras & Wiki
    rulesList: Object.values(DEFAULT_RULES),
    currentCategory: "gerais",
    ruleSearchQuery: "",
    toastMessage: "",
    toastVisible: false,

    // Código Penal & Calculadora
    penalCode: STRUCTURED_PENAL_CODE,
    penalFilter: "all",
    selectedPenalIds: [],
    hasLawyer: false,
    isFirstOffense: false,
    inGamePlayerId: "",

    // Formulário de Candidatura (Stepper)
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
      this.refreshAllTelemetry();

      // 3. Sincronização inicial de abas por URL / Hash
      try {
        const hash = window.location.hash;
        if (hash === "#status" || window.location.search.includes("tab=status")) {
          this.recruitTab = "status";
        }
        if (hash === "#calculadora") {
          this.currentCategory = "codigo_penal";
        }
      } catch (e) {}

      // Atualiza telemetria do FiveM e Discord em tempo real a cada 15 segundos
      setInterval(() => this.refreshAllTelemetry(), 15000);

      // Ouvir tecla Escape para fechar modais
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeAllModals();
        }
      });
    },

    showToast(msg) {
      this.toastMessage = msg;
      this.toastVisible = true;
      setTimeout(() => (this.toastVisible = false), 3500);
    },

    closeAllModals() {
      this.recruitModalOpen = false;
      this.staffLoginModalOpen = false;
      this.mobileMenuOpen = false;
    },

    openRecruitModal(tab = "apply") {
      this.recruitTab = tab;
      this.recruitModalOpen = true;
      this.mobileMenuOpen = false;
    },

    openLoginModal() {
      this.staffLoginModalOpen = true;
      this.mobileMenuOpen = false;
    },

    // 1. Telemetria em Tempo Real (FiveM & Discord)
    async loadFiveMStatus() {
      try {
        const data = await api.getFiveMStatus();
        if (data) {
          this.fivemOnline = Number(data.clients ?? 0);
          this.fivemMaxClients = Number(data.maxClients ?? 128);
          this.fivemIsOnline = Boolean(data.online);
          if (data.serverName) this.fivemServerName = data.serverName;
          if (typeof data.ping === "number") this.fivemPing = data.ping;
          this.fivemLoaded = true;
        }
      } catch (e) {
        console.warn("Falha ao sincronizar telemetria FiveM:", e);
      }
    },

    async loadDiscordStatus() {
      try {
        const data = await api.getDiscordStatus();
        if (data) {
          this.discordOnline = Number(data.presenceCount ?? 0);
          this.discordMembers = Number(data.memberCount ?? 0);
          if (data.guildName) this.discordGuildName = data.guildName;
          this.discordLoaded = true;
        }
      } catch (e) {
        console.warn("Falha ao sincronizar telemetria Discord:", e);
      }
    },

    async refreshAllTelemetry() {
      await Promise.allSettled([
        this.loadFiveMStatus(),
        this.loadDiscordStatus(),
      ]);
    },

    copyIp() {
      navigator.clipboard.writeText("connect distritopaulistarp.fivebr.gg");
      this.ipCopied = true;
      this.showToast("Comando 'connect distritopaulistarp.fivebr.gg' copiado com sucesso!");
      setTimeout(() => (this.ipCopied = false), 2500);
    },

    connectDirectly() {
      this.copyIp();
      // Tenta abrir o protocolo direto do FiveM
      window.location.href = "fivem://connect/distritopaulistarp.fivebr.gg";
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
          if (!this.currentUser) {
            this.isLoggedIn = false;
          }
        }
      } catch (e) {}
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
          this.staffLoginModalOpen = false;
          this.showToast(`Bem-vindo de volta, ${res.user.displayName}! Redirecionando...`);
          setTimeout(() => {
            window.location.href = "./dashboard.html";
          }, 800);
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
          this.staffLoginModalOpen = false;
          this.showToast(`Autenticado como ${res.user.displayName}! Redirecionando...`);
          setTimeout(() => {
            window.location.href = "./dashboard.html";
          }, 800);
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
      this.showToast("Sessão desconectada com sucesso.");
    },

    // 3. Regras Oficiais
    async loadRules() {
      try {
        const data = await api.getRules();
        if (data && Array.isArray(data) && data.length > 0) {
          this.rulesList = data;
        }
      } catch (e) {
        // Mantém DEFAULT_RULES
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

    // 4. Código Penal & Calculadora Interativa
    get filteredPenalCode() {
      let list = this.penalCode;
      if (this.penalFilter !== "all") {
        list = list.filter((item) => item.category === this.penalFilter);
      }
      const q = this.ruleSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (item) =>
            item.article.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.notes.toLowerCase().includes(q)
        );
      }
      return list;
    },

    get penalCategories() {
      const cats = new Set(this.penalCode.map((c) => c.category));
      return Array.from(cats);
    },

    togglePenalCrime(crimeId) {
      if (this.selectedPenalIds.includes(crimeId)) {
        this.selectedPenalIds = this.selectedPenalIds.filter((id) => id !== crimeId);
      } else {
        this.selectedPenalIds.push(crimeId);
      }
    },

    removePenalCrime(crimeId) {
      this.selectedPenalIds = this.selectedPenalIds.filter((id) => id !== crimeId);
    },

    isCrimeSelected(crimeId) {
      return this.selectedPenalIds.includes(crimeId);
    },

    clearPenalCalculator() {
      this.selectedPenalIds = [];
      this.hasLawyer = false;
      this.isFirstOffense = false;
      this.inGamePlayerId = "";
      this.showToast("Calculadora penal reiniciada.");
    },

    get selectedCrimesObjects() {
      return this.penalCode.filter((c) => this.selectedPenalIds.includes(c.id));
    },

    get calculatedBaseMonths() {
      return this.selectedCrimesObjects.reduce((acc, c) => acc + (c.months || 0), 0);
    },

    get calculatedDiscountPercent() {
      let pct = 0;
      if (this.hasLawyer) pct += 20;
      if (this.isFirstOffense) pct += 30;
      return Math.min(pct, 50);
    },

    get calculatedDiscountMonths() {
      if (this.calculatedDiscountPercent === 0) return 0;
      return Math.round(this.calculatedBaseMonths * (this.calculatedDiscountPercent / 100));
    },

    get calculatedTotalMonths() {
      const base = this.calculatedBaseMonths;
      const discounted = Math.max(base - this.calculatedDiscountMonths, 1);
      // Teto máximo de reclusão no RP (120 meses / 2 horas)
      return Math.min(discounted, 120);
    },

    get calculatedTotalFine() {
      return this.selectedCrimesObjects.reduce((acc, c) => acc + (c.fine || 0), 0);
    },

    get calculatedBailable() {
      if (this.selectedPenalIds.length === 0) return true;
      // Se qualquer um dos crimes for inafiançável, o flagrante todo é inafiançável
      return !this.selectedCrimesObjects.some((c) => c.bailable === false);
    },

    get calculatedBailAmount() {
      if (!this.calculatedBailable) return 0;
      return this.selectedCrimesObjects.reduce((acc, c) => acc + (c.bailAmount || c.fine || 0), 0);
    },

    get unbailableReasons() {
      const unbailable = this.selectedCrimesObjects.filter((c) => c.bailable === false);
      if (unbailable.length === 0) return "";
      return unbailable.map((c) => `${c.article} (${c.name})`).join(", ");
    },

    copyInGameCommand() {
      if (this.selectedCrimesObjects.length === 0) {
        this.showToast("Selecione os artigos antes de gerar o comando.");
        return;
      }
      const id = this.inGamePlayerId.trim() || "[ID]";
      const cmd = `/prender ${id} ${this.calculatedTotalMonths} ${this.calculatedTotalFine}`;
      navigator.clipboard.writeText(cmd);
      this.showToast(`Comando copiado: ${cmd}`);
    },

    copyPenalReport() {
      if (this.selectedCrimesObjects.length === 0) {
        this.showToast("Selecione ao menos um artigo para gerar o relatório.");
        return;
      }

      const crimesList = this.selectedCrimesObjects
        .map((c) => `• ${c.article} - ${c.name} (${c.months} meses | Multa: R$ ${c.fine.toLocaleString("pt-BR")})`)
        .join("\n");

      let attenuatorsText = "Nenhum atenuante aplicado.";
      if (this.hasLawyer && this.isFirstOffense) {
        attenuatorsText = "Advogado Constituído (-20%) + Réu Primário (-30%) [Total: -50% de redução legal]";
      } else if (this.hasLawyer) {
        attenuatorsText = "Advogado Constituído presente na Delegacia (-20% de redução legal)";
      } else if (this.isFirstOffense) {
        attenuatorsText = "Réu Primário / Confissão Espontânea (-30% de redução legal)";
      }

      const report = `[BOLETIM DE OCORRÊNCIA / LAUDO DE FLAGRANTE]
POLÍCIA CIVIL & MILITAR — DISTRITO PAULISTA RP
===================================================
INDICIADO / CIDADÃO: ${this.inGamePlayerId ? `Passaporte ID ${this.inGamePlayerId}` : "Não informado no momento do registro"}
DATA/HORA DO REGISTRO: ${new Date().toLocaleString("pt-BR")}

ARTIGOS IMPUTADOS:
${crimesList}

• PENA BASE CALCULADA: ${this.calculatedBaseMonths} Meses
• ATENUANTES APLICADOS: ${attenuatorsText}
• PENA FINAL DE RECLUSÃO: ${this.calculatedTotalMonths} Meses ${this.calculatedTotalMonths >= 120 ? "(Teto Penal Máximo de 120m Aplicado)" : ""}
• MULTA PROCESSUAL TOTAL: R$ ${this.calculatedTotalFine.toLocaleString("pt-BR")}
• REGIME DE FIANÇA: ${this.calculatedBailable ? `AFIANÇÁVEL (Valor Arbitrado: R$ ${this.calculatedBailAmount.toLocaleString("pt-BR")})` : `INAFIANÇÁVEL (Artigos impeditivos: ${this.unbailableReasons})`}
===================================================
COMANDO IN-GAME: /prender ${this.inGamePlayerId || "[ID]"} ${this.calculatedTotalMonths} ${this.calculatedTotalFine}
Emitido via Portal Oficial: distritopaulistarp.fivebr.gg`;

      navigator.clipboard.writeText(report);
      this.showToast("Laudo completo copiado para o Clipboard!");
    },

    // 5. Stepper do Formulário de Candidatura
    nextStep() {
      if (this.recruitStep === 1) {
        if (!this.appForm.gameName.trim() || !this.appForm.discordTag.trim() || !this.appForm.age) {
          this.appErrorMessage = "Por favor, preencha todos os campos obrigatórios da Etapa 1.";
          return;
        }
        this.appErrorMessage = "";
        this.recruitStep = 2;
      } else if (this.recruitStep === 2) {
        if (!this.appForm.availability.trim() || !this.appForm.experience.trim()) {
          this.appErrorMessage = "Por favor, relate seus horários e experiência na Etapa 2.";
          return;
        }
        this.appErrorMessage = "";
        this.recruitStep = 3;
      }
    },

    prevStep() {
      if (this.recruitStep > 1) {
        this.recruitStep--;
        this.appErrorMessage = "";
      }
    },

    async submitApplication() {
      this.appSuccessMessage = "";
      this.appErrorMessage = "";

      if (!this.appForm.acceptedRules) {
        this.appErrorMessage = "Você deve aceitar e concordar com o regulamento do servidor para prosseguir.";
        return;
      }

      if (!this.appForm.scenario1.trim() || !this.appForm.scenario2.trim() || !this.appForm.motivation.trim()) {
        this.appErrorMessage = "Responda a todas as perguntas situacionais e sua motivação.";
        return;
      }

      this.appSubmitting = true;

      try {
        const payload = {
          gameName: this.appForm.gameName,
          discordTag: this.appForm.discordTag,
          age: Number(this.appForm.age),
          desiredRole: this.appForm.desiredRole,
          availability: this.appForm.availability,
          experience: this.appForm.experience,
          scenario1: this.appForm.scenario1,
          scenario2: this.appForm.scenario2,
          motivation: this.appForm.motivation,
          turnstileToken: "1x00000000000000000000AA",
        };

        const res = await api.submitApplication(payload);
        this.appSuccessMessage = res.message || "Candidatura enviada com sucesso! Guarde seu Discord para consultar o status.";

        // Salva busca automática para o candidato consultar imediatamente
        this.statusSearchQuery = this.appForm.discordTag;

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
        this.recruitStep = 1;
      } catch (err) {
        this.appErrorMessage = err.message || "Erro ao enviar candidatura. Tente novamente.";
      } finally {
        this.appSubmitting = false;
      }
    },

    // 6. Consulta de Status
    async checkStatus() {
      if (!this.statusSearchQuery || this.statusSearchQuery.trim().length < 2) {
        return;
      }

      this.statusSearching = true;
      this.statusSearched = true;

      try {
        const results = await api.checkApplicationStatus(this.statusSearchQuery.trim());
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
          return { label: "Aprovado para Entrevista", class: "status-approved", step: 3, icon: "fa-solid fa-circle-check" };
        case "rejected":
          return { label: "Inscrição Reprovada", class: "status-rejected", step: 3, icon: "fa-solid fa-circle-xmark" };
        case "reviewing":
          return { label: "Em Análise pela Diretoria", class: "status-reviewing", step: 2, icon: "fa-solid fa-hourglass-half" };
        default:
          return { label: "Aguardando Triagem", class: "status-pending", step: 1, icon: "fa-solid fa-inbox" };
      }
    },
  }));
}

registerPortalApp();
window.Alpine = Alpine;
Alpine.start();

// Inicialização do Swup para Transições de Página
try {
  const swup = new Swup({
    animationSelector: '[class*="transition-"]',
    containers: ["#swup"],
    cache: true,
    linkSelector: 'a[href]:not([download]):not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href*="dashboard"]):not([href^="http://"]):not([href^="https://"]):not([href^="fivem:"])'
  });

  if (swup.hooks && swup.hooks.before) {
    swup.hooks.before("content:replace", () => {
      const oldContainer = document.getElementById("swup");
      if (oldContainer && window.Alpine && typeof window.Alpine.destroyTree === "function") {
        window.Alpine.destroyTree(oldContainer);
      }
    });
  }

  swup.hooks.on("page:view", () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const swupContainer = document.getElementById("swup");
    if (swupContainer && window.Alpine) {
      window.Alpine.initTree(swupContainer);
    }
    const path = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const isHome = (path === "/" || path === "/index.html" || path === "") &&
                     (href.includes("index") || href === "./" || href === "/");
      const isMatch = isHome ||
                     (href.includes("como-jogar") && path.includes("como-jogar")) ||
                     (href.includes("regras") && path.includes("regras")) ||
                     (href.includes("recrutamento") && path.includes("recrutamento"));
      link.classList.toggle("active", Boolean(isMatch));
    });

    // Deep-linking e sincronização de abas por URL
    const hash = window.location.hash;
    const bodyEl = document.querySelector('[x-data="portalApp"]');
    if (bodyEl && window.Alpine && typeof window.Alpine.$data === "function") {
      const app = window.Alpine.$data(bodyEl);
      if (app) {
        if (hash === "#status" || window.location.search.includes("tab=status")) {
          app.recruitTab = "status";
        }
        if (hash === "#calculadora") {
          app.currentCategory = "codigo_penal";
        }
        if (!app.rulesList || app.rulesList.length === 0) {
          app.loadRules();
        }
      }
    }

    if (hash) {
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 60);
    }
  });
} catch (e) {
  console.warn("Swup init error:", e);
}
