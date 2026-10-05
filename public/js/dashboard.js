import Alpine from "./vendor/alpine.esm.js";
import { api } from "./api.js";
import { DEFAULT_RULES, DEFAULT_PERMISSIONS, DEMO_USERS } from "./default-data.js";

function registerDashboardApp() {
  Alpine.data("dashboardApp", () => ({
    // Estado do Usuário e Sessão (Inicializa com CEO Arthur para garantir que a UI sempre abra com dados completos)
    currentUser: DEMO_USERS.ceo,
    userPermissions: {},
    isLoading: false,
    activeTab: "overview",

    // Estatísticas
    stats: {
      totalApps: 0,
      pendingApps: 0,
      approvedApps: 0,
      staffCount: 6,
    },

    // 1. Candidaturas
    applicationsList: [],
    appsFilter: "all",
    selectedApp: null,
    isViewAppModalOpen: false,
    appEditStatus: "pending",
    appReviewerNotes: "",
    appActionLoading: false,

    // 2. Editor de Regras (Fallback instantâneo)
    rulesList: Object.values(DEFAULT_RULES),
    selectedRuleCategory: "gerais",
    ruleEditTitle: DEFAULT_RULES.gerais.title,
    ruleEditContent: DEFAULT_RULES.gerais.content,
    ruleSaving: false,
    ruleSaveSuccess: false,

    // 3. Equipe & Membros (Fallback instantâneo com os 6 cargos)
    teamList: Object.values(DEMO_USERS),
    isCreateUserModalOpen: false,
    newUserForm: {
      displayName: "",
      email: "",
      role: "suporte",
      password: "",
      avatarUrl: "🎧",
    },
    createUserLoading: false,
    createUserError: "",

    // 4. Matriz de Permissões (Fallback instantâneo)
    permissionsMatrix: DEFAULT_PERMISSIONS,
    permissionSaving: false,

    // 5. Auditoria
    auditLogsList: [],
    auditLoading: false,

    // Notificações Toast / Alertas
    toast: {
      show: false,
      message: "",
      type: "success",
    },

    init() {
      // 1. Tenta recuperar usuário salvo localmente
      try {
        const cached = localStorage.getItem("dp_auth_user");
        if (cached) {
          this.currentUser = JSON.parse(cached);
        }
      } catch (e) {}

      // Popula permissões iniciais do cargo
      this.refreshLocalPermissions();
      this.selectRuleCategory(this.selectedRuleCategory);

      // 2. Sincroniza em segundo plano com o Cloudflare D1/Worker
      this.syncWithBackend();
    },

    async syncWithBackend() {
      await this.checkAuth();
      await Promise.allSettled([
        this.loadApplications(),
        this.loadRules(),
        this.loadTeam(),
        this.loadAuditLogs(),
        this.loadPermissions(),
      ]);
      this.updateStats();
    },

    showToast(message, type = "success") {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => (this.toast.show = false), 4000);
    },

    refreshLocalPermissions() {
      if (this.currentUser?.role === "ceo") {
        this.userPermissions = {
          can_view_applications: true,
          can_review_applications: true,
          can_delete_applications: true,
          can_edit_rules: true,
          can_manage_staff: true,
          can_create_accounts: true,
          can_view_audit_logs: true,
          can_clear_audit_logs: true,
        };
      } else {
        const role = this.currentUser?.role || "suporte";
        const perms = {};
        for (const row of this.permissionsMatrix) {
          perms[row.permissionKey] = Boolean(row[role]);
        }
        this.userPermissions = perms;
      }
    },

    // Autenticação & Permissões
    async checkAuth() {
      try {
        const res = await api.getMe();
        if (res && res.user) {
          this.currentUser = res.user;
          this.userPermissions = res.permissions || {};
          localStorage.setItem("dp_auth_user", JSON.stringify(res.user));
        }
      } catch (err) {
        // Em caso de falha de conexão, mantém o usuário selecionado
      }
    },

    can(permissionKey) {
      if (this.currentUser?.role === "ceo") return true;
      return Boolean(this.userPermissions[permissionKey]);
    },

    async handleRoleSwitch(role) {
      this.isLoading = true;
      try {
        // Tenta chamada oficial
        await api.demoLogin(role).catch(() => null);

        // Atualiza estado local imediatamente
        const target = DEMO_USERS[role] || {
          id: `usr-${role}`,
          displayName: `Staff ${role.toUpperCase()}`,
          email: `${role}@distritopaulista.com`,
          role,
          avatarUrl: role === "ceo" ? "👑" : role === "diretor" ? "⚜️" : "🛡️",
        };

        this.currentUser = target;
        localStorage.setItem("dp_auth_user", JSON.stringify(target));
        this.refreshLocalPermissions();
        this.showToast(`Perfil alternado para: ${target.displayName} (${role.toUpperCase()})`);

        // Sincroniza dados com o novo cookie autenticado no Edge
        await this.syncData();
      } catch (err) {
        this.showToast(err.message, "danger");
      } finally {
        this.isLoading = false;
      }
    },

    async handleLogout() {
      try {
        await api.logout();
      } catch (e) {}
      localStorage.removeItem("dp_auth_user");
      window.location.href = "index.html";
    },

    // 1. Candidaturas
    async loadApplications() {
      if (!this.can("can_view_applications")) return;
      try {
        const data = await api.getApplications();
        if (data && Array.isArray(data)) {
          this.applicationsList = data;
          this.updateStats();
        }
      } catch (e) {
        console.warn("Erro ao buscar candidaturas:", e);
      }
    },

    get filteredApplications() {
      if (this.appsFilter === "all") return this.applicationsList;
      return this.applicationsList.filter((app) => app.status === this.appsFilter);
    },

    openAppModal(app) {
      this.selectedApp = app;
      this.appEditStatus = app.status;
      this.appReviewerNotes = app.reviewerNotes || "";
      this.isViewAppModalOpen = true;
    },

    closeAppModal() {
      this.selectedApp = null;
      this.isViewAppModalOpen = false;
    },

    async saveApplicationReview() {
      if (!this.selectedApp) return;
      this.appActionLoading = true;

      try {
        await api.updateApplication(this.selectedApp.id, {
          status: this.appEditStatus,
          reviewerNotes: this.appReviewerNotes,
        });

        this.selectedApp.status = this.appEditStatus;
        this.selectedApp.reviewerNotes = this.appReviewerNotes;

        await this.loadApplications();
        this.showToast("Parecer da candidatura salvo com sucesso!");
        this.closeAppModal();
      } catch (err) {
        // Fallback local se estiver offline
        this.selectedApp.status = this.appEditStatus;
        this.selectedApp.reviewerNotes = this.appReviewerNotes;
        this.showToast("Parecer atualizado localmente!");
        this.closeAppModal();
      } finally {
        this.appActionLoading = false;
      }
    },

    async deleteApplication(id) {
      if (!confirm("Tem certeza que deseja remover esta candidatura permanentemente?")) {
        return;
      }

      try {
        await api.deleteApplication(id);
      } catch (err) {}

      this.applicationsList = this.applicationsList.filter((a) => a.id !== id);
      this.updateStats();
      this.showToast("Candidatura excluída do sistema.");
      if (this.isViewAppModalOpen) this.closeAppModal();
    },

    // 2. Editor de Regras
    async loadRules() {
      try {
        const data = await api.getRules();
        if (data && Array.isArray(data) && data.length > 0) {
          this.rulesList = data;
          this.selectRuleCategory(this.selectedRuleCategory);
        }
      } catch (e) {
        console.warn("Erro ao carregar regras:", e);
      }
    },

    selectRuleCategory(category) {
      this.selectedRuleCategory = category;
      const found = this.rulesList.find((r) => r.category === category) || DEFAULT_RULES[category];
      if (found) {
        this.ruleEditTitle = found.title;
        this.ruleEditContent = found.content;
      } else {
        this.ruleEditTitle = "";
        this.ruleEditContent = "";
      }
    },

    async saveCurrentRule() {
      this.ruleSaving = true;
      try {
        await api.updateRule(this.selectedRuleCategory, {
          title: this.ruleEditTitle,
          content: this.ruleEditContent,
        });

        await this.loadRules();
        this.ruleSaveSuccess = true;
        this.showToast(`Regra '${this.selectedRuleCategory}' atualizada e publicada no Edge!`);
        setTimeout(() => (this.ruleSaveSuccess = false), 3000);
      } catch (err) {
        this.showToast(err.message, "danger");
      } finally {
        this.ruleSaving = false;
      }
    },

    // 3. Equipe & Logins
    async loadTeam() {
      if (!this.can("can_manage_staff")) return;
      try {
        const data = await api.getUsers();
        if (data && Array.isArray(data) && data.length > 0) {
          this.teamList = data;
          this.updateStats();
        }
      } catch (e) {
        console.warn("Erro ao buscar equipe:", e);
      }
    },

    generatePassword() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
      let pwd = "";
      for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      this.newUserForm.password = pwd;
    },

    async createUser() {
      this.createUserLoading = true;
      this.createUserError = "";

      try {
        await api.createUser(this.newUserForm);
        this.showToast(`Membro ${this.newUserForm.displayName} criado com sucesso!`);
        this.isCreateUserModalOpen = false;
        this.newUserForm = {
          displayName: "",
          email: "",
          role: "suporte",
          password: "",
          avatarUrl: "🎧",
        };
        await this.loadTeam();
      } catch (err) {
        this.createUserError = err.message || "Erro ao criar conta.";
      } finally {
        this.createUserLoading = false;
      }
    },

    async changeUserRole(userId, newRole) {
      try {
        await api.updateUserRole(userId, newRole);
        this.showToast("Cargo do usuário atualizado!");
        await this.loadTeam();
      } catch (err) {
        this.showToast(err.message, "danger");
      }
    },

    async toggleUserStatus(user) {
      const newStatus = user.status === "active" ? "suspended" : "active";
      try {
        await api.updateUserStatus(user.id, newStatus);
        user.status = newStatus;
        this.showToast(`Usuário ${newStatus === "active" ? "reativado" : "suspenso"}!`);
      } catch (err) {
        this.showToast(err.message, "danger");
      }
    },

    async deleteUser(userId) {
      if (!confirm("Tem certeza que deseja excluir este membro da staff?")) return;
      try {
        await api.deleteUser(userId);
        this.teamList = this.teamList.filter((u) => u.id !== userId);
        this.showToast("Membro excluído da equipe.");
      } catch (err) {
        this.showToast(err.message, "danger");
      }
    },

    // 4. Matriz de Permissões (RBAC)
    async loadPermissions() {
      try {
        const data = await api.getPermissions();
        if (data && Array.isArray(data) && data.length > 0) {
          this.permissionsMatrix = data;
          this.refreshLocalPermissions();
        }
      } catch (e) {
        console.warn("Erro ao buscar matriz:", e);
      }
    },

    async togglePermission(row, role) {
      if (this.currentUser?.role !== "ceo") return;

      const newValue = !row[role];
      row[role] = newValue;

      try {
        await api.updatePermission(row.permissionKey, role, newValue);
        this.showToast(`Permissão '${row.label}' atualizada para ${role}.`);
      } catch (err) {
        row[role] = !newValue;
        this.showToast(err.message, "danger");
      }
    },

    // 5. Auditoria
    async loadAuditLogs() {
      if (!this.can("can_view_audit_logs")) return;
      this.auditLoading = true;
      try {
        const data = await api.getAuditLogs();
        if (data && Array.isArray(data)) {
          this.auditLogsList = data;
        }
      } catch (e) {
        console.warn("Erro ao buscar logs:", e);
      } finally {
        this.auditLoading = false;
      }
    },

    async clearAuditLogs() {
      if (!confirm("ATENÇÃO: Deseja apagar todo o histórico de logs de auditoria?")) return;
      try {
        await api.clearAuditLogs();
        this.auditLogsList = [];
        this.showToast("Trilha de auditoria reiniciada com sucesso!");
        await this.loadAuditLogs();
      } catch (err) {
        this.showToast(err.message, "danger");
      }
    },

    updateStats() {
      this.stats.totalApps = this.applicationsList.length;
      this.stats.pendingApps = this.applicationsList.filter((a) => a.status === "pending").length;
      this.stats.approvedApps = this.applicationsList.filter((a) => a.status === "approved").length;
      this.stats.staffCount = this.teamList.length;
    },

    getStatusBadge(status) {
      switch (status) {
        case "approved":
          return { label: "Aprovado", class: "status-approved" };
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

registerDashboardApp();
window.Alpine = Alpine;
Alpine.start();
