# 🏙️ Distrito Paulista RP — Hono & Cloudflare Edge Suite

Portal Oficial e Dashboard SaaS da Staff do servidor de FiveM **Distrito Paulista RP**, reescrito integralmente no ecossistema **Cloudflare Edge** com **[Hono v4](https://hono.dev/)**, substituindo 100% o Supabase e Vercel por **Cloudflare Workers, D1 (SQLite Serverless), KV, Drizzle ORM e Turnstile**, mantendo **100% de paridade visual** com o design original.

---

## ⚡ Tecnologias & Arquitetura

- **Runtime & Servidor Edge**: Cloudflare Workers com [Hono v4](https://hono.dev/).
- **Entrega de Frontend**: Cloudflare Workers Static Assets (`./public`).
- **Banco de Dados Relacional**: Cloudflare D1 gerenciado via **Drizzle ORM** com migrations e type-safety.
- **Autenticação & Sessão**: JWT emitido em Cookie seguro `HttpOnly` com criptografia nativa **Web Crypto (PBKDF2 HMAC-SHA256)**.
- **Controle de Acesso (RBAC)**: 6 Níveis Hierárquicos (`suporte`, `moderador`, `administrador`, `gerente`, `diretor`, `ceo`) + Matriz Dinâmica de Permissões gerenciada pelo CEO.
- **Cache & Rate-Limiting**: Cloudflare KV (cache de regras públicas, status do servidor FiveM e proteção contra ataques de força bruta).
- **Proteção Anti-Bot**: Cloudflare Turnstile nos formulários públicos de candidatura e login.
- **Reatividade da Interface**: **Alpine.js** de forma declarativa e modular, eliminando os scripts imperativos legados.

---

## 📂 Estrutura do Projeto

```text
Hono-DP/
├── package.json               # Dependências e scripts
├── tsconfig.json              # Configurações TypeScript para Cloudflare Workers
├── wrangler.toml              # Bindings do Cloudflare (D1, KV, Static Assets, Vars)
├── drizzle.config.ts          # Configuração do Drizzle ORM para SQLite D1
├── migrations/                # Migrations SQL e Seed do D1
│   ├── 0000_cute_sue_storm.sql# Schema DDL oficial das tabelas
│   └── seed.sql               # Matriz de permissões, regras e contas de teste
├── src/
│   ├── index.ts               # Entrypoint do Worker Hono, CORS e Middlewares
│   ├── env.ts                 # Tipos de bindings do Cloudflare e payload JWT
│   ├── db/
│   │   ├── schema.ts          # Definição das tabelas com Drizzle ORM
│   │   └── index.ts           # Client Drizzle D1
│   ├── middleware/
│   │   ├── auth.ts            # Extração e validação do JWT de Cookie HttpOnly
│   │   ├── rbac.ts            # Verificação de cargos e matriz dinâmica de permissões
│   │   ├── rate-limit.ts      # Rate-limiting por IP com Cloudflare KV
│   │   └── turnstile.ts       # Validação anti-bot Cloudflare Turnstile
│   ├── routes/
│   │   ├── auth.ts            # Login, Demo Login, Me, Logout
│   │   ├── rules.ts           # Regras da cidade (leitura pública com cache KV / edição staff)
│   │   ├── applications.ts    # Envio, consulta de status e avaliação de candidaturas
│   │   ├── admin.ts           # Gestão de usuários, matriz de permissões do CEO e auditoria
│   │   └── fivem.ts           # Status e contagem de jogadores online
│   └── utils/
│       └── crypto.ts          # PBKDF2 hash e verificação via Web Crypto API
└── public/                    # Frontend servido diretamente no Edge
    ├── index.html             # Portal oficial público com Alpine.js
    ├── dashboard.html         # Dashboard SaaS da Staff com Alpine.js
    ├── style.css              # Identidade visual 1:1 original FiveM Cyberpunk/Luxo
    ├── assets/                # Logos e imagens oficiais
    └── js/
        ├── api.js             # Cliente HTTP centralizado para /api/*
        ├── portal.js          # Componente Alpine.js do Portal Público
        └── dashboard.js       # Componente Alpine.js do Dashboard Staff
```

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js v18+ e npm instalados.

### 2. Instalação das Dependências
```bash
cd Hono-DP
npm install
```

### 3. Aplicar Schema e Seed no Cloudflare D1 Local
```bash
# Executa a migration inicial no banco SQLite D1 local
npm run db:migrate:local

# Popula o banco com regras, matriz de permissões e as contas dos 6 cargos
npm run db:seed:local
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor estará rodando em `http://localhost:8787` com:
- Portal Público: `http://localhost:8787/`
- Dashboard Staff: `http://localhost:8787/dashboard`
- API Health Check: `http://localhost:8787/api/health`

---

## 🔑 Contas de Demonstração Pré-Configuradas

Em ambiente de desenvolvimento (`DEMO_MODE=true`), você pode usar tanto os **botões de atalho de 1-clique** na tela de login quanto autenticar-se manualmente com os e-mails e a senha padrão abaixo:

| Cargo Hierárquico | E-mail de Login | Senha Padrão |
| :--- | :--- | :--- |
| **👑 CEO (Master)** | `ceo@distritopaulista.com` | `Senha@123` |
| **⚜️ Diretor** | `diretor@distritopaulista.com` | `Senha@123` |
| **💼 Gerente** | `gerente@distritopaulista.com` | `Senha@123` |
| **⚖️ Administrador** | `admin@distritopaulista.com` | `Senha@123` |
| **🛡️ Moderador** | `moderador@distritopaulista.com` | `Senha@123` |
| **🎧 Suporte** | `suporte@distritopaulista.com` | `Senha@123` |

---

## 🌐 Deploy em Produção na Cloudflare

1. Crie seu banco D1 e namespace KV no Cloudflare Dashboard ou via Wrangler:
```bash
npx wrangler d1 create hono-dp-db
npx wrangler kv namespace create KV
```
2. Atualize o `database_id` e o `id` do KV no seu `wrangler.toml`.
3. Aplique as migrations e seed no D1 de produção:
```bash
npx wrangler d1 execute hono-dp-db --remote --file=./migrations/0000_cute_sue_storm.sql
npx wrangler d1 execute hono-dp-db --remote --file=./migrations/seed.sql
```
4. Faça o deploy:
```bash
npm run deploy
```
