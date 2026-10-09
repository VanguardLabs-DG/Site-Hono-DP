---
name: Distrito Paulista RP Design System
version: 3.0.0
description: "Design System Oficial do Distrito Paulista RP, baseado no padrão ouro de NUI vanguard_esc. Estética luxury cyberpunk dark, acentos em Vivid Gold (#e5a93c) e Cyan (#00e5ff), tipografia Sora + Rajdhani + JetBrains Mono, e arquitetura Atomic Design rigorosa."
colors:
  dark-900: "#060608"
  dark-800: "#0a0a0f"
  dark-700: "#121218"
  dark-600: "#181820"
  dark-500: "#22222e"
  gold-primary: "#e5a93c"
  gold-light: "#f5b945"
  gold-dark: "#b37e20"
  gold-glow: "rgba(229, 169, 60, 0.25)"
  gold-glow-strong: "rgba(229, 169, 60, 0.50)"
  cyan-tech: "#00e5ff"
  cyan-light: "#38bdf8"
  green-accent: "#10b981"
  red-danger: "#ef4444"
  purple-accent: "#a855f7"
  glass-bg: "rgba(10, 10, 16, 0.85)"
  glass-border: "rgba(255, 255, 255, 0.08)"
  glass-highlight: "rgba(255, 255, 255, 0.04)"
  text-primary: "#FFFFFF"
  text-secondary: "#d4d4d8"
  text-muted: "#8a8a93"
typography:
  font-body: "Sora, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  font-heading: "Rajdhani, 'Sora', sans-serif"
  font-mono: "'JetBrains Mono', monospace"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-gold:
    backgroundColor: "{colors.gold-primary}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-glass:
    backgroundColor: "{colors.glass-bg}"
    borderColor: "{colors.glass-border}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Distrito Paulista RP — Design System & Especificação de Design Atômico

## Overview
O **Distrito Paulista RP Design System** é a única fonte da verdade visual para todos os ativos digitais da cidade (Portal Público, Dashboard SaaS da Staff e recursos NUI FiveM). Inspirado diretamente no componente de referência **`vanguard_esc`**, ele entrega uma estética sofisticada de **Luxury Cyberpunk HUD**, unindo fundos pretos profundos com camadas em vidro fumê (*glassmorphism*), acentos em dourado nobre (`#e5a93c`) e ciano tecnológico (`#00e5ff`).

O projeto adota a metodologia de **Atomic Design** estrita:
- **Foundations / Tokens:** Variáveis de cor, tipografia, espaçamento, elevação e raio.
- **Atoms (Átomos):** Botões, inputs, checkboxes, badges, tags e indicadores de status.
- **Molecules (Moléculas):** Barras de busca, chips de filtro, abas de categoria, nós de stepper e estatísticas.
- **Organisms (Organismos):** Top Ticker, Header, Hero, Onboarding 3-Step, Pilares da Cidade, Wiki de Regras, Calculadora Penal, Modais de Recrutamento/Login e Footer.
- **Templates / Pages:** Portal Oficial do Jogador (`index.html`) e Dashboard da Staff (`dashboard.html`).

---

## Colors

### Base Darks (Camadas de Profundidade)
- **Deep Base (`--d900` / `#060608`):** Fundo absoluto da aplicação e canvas principal.
- **Surface Level 1 (`--d800` / `#0a0a0f`):** Superfície de cartões, seções e barras fixas.
- **Surface Level 2 (`--d700` / `#121218`):** Contêineres internos, campos de formulário e itens secundários.
- **Surface Hover (`--d600` / `#181820`):** Estados de foco e hover em cartões interativos.
- **Border Subtle (`--d500` / `#22222e`):** Linhas divisórias internas.

### Identidade Distrito Paulista (Ouro & Luxo)
- **Dourado Primário (`--gold` / `#e5a93c`):** Botões principais, ícones de destaque e links ativos.
- **Dourado Claro (`--gold-l` / `#f5b945`):** Estados de hover e brilhos de acabamento.
- **Dourado Escuro (`--gold-d` / `#b37e20`):** Bordas de botões e estados pressionados.
- **Glow Dourado (`--gold-glow` / `rgba(229, 169, 60, 0.25)`): Sombras de iluminação em botões nobres e nós ativos.

### Acentos Tecnológicos & Status
- **Cyan Tech (`--cyan` / `#00e5ff`):** Acentos policiais de alta tecnologia, links especiais e destaques de mapas.
- **Green Success (`--green` / `#10b981`):** Servidor online, aprovação de candidatos e crimes afiançáveis.
- **Red Danger (`--red` / `#ef4444`):** Crimes inafiançáveis, desativação de conta e erros.
- **Purple Discord (`--purple` / `#a855f7`):** Comunidade e canais de streaming.

---

## Typography

- **Interface & Leitura Geral:** `Sora`, sans-serif. Pesos: 400 (regular), 600 (semi-bold), 700 (bold). Garante clareza cristalina em telas de alta e baixa densidade de pixels.
- **Cabeçalhos, Contadores & Badges:** `Rajdhani`, sans-serif. Pesos: 600, 700, 800. Proporciona o visual imersivo e angular característico do ecossistema FiveM.
- **Console F8 & Artigos Penais:** `JetBrains Mono`, monospace. Pesos: 400, 600. Para comandos executáveis, artigos de lei e dados numéricos tabulares.

---

## Layout & Rhythm (Grade de 8px)
Todos os espaçamentos respeitam a progressão aritmética de 4px/8px:
- `4px` (micro detalhes e tags)
- `8px` (gaps de botões e ícones)
- `12px` (paddings internos de chips)
- `16px` (paddings padrão de inputs)
- `24px` (paddings de cartões e modais)
- `32px` (espaçamento entre blocos)
- `48px` (distância entre seções verticais)
- `64px` / `80px` (respiro de seções macro)

---

## Elevation & Depth (Superfícies de Vidro)
- **Glass Card Padrão:** `background: rgba(10, 10, 16, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08);`
- **VIP Standout Card:** `background: linear-gradient(135deg, rgba(245, 185, 69, 0.14) 0%, rgba(10, 10, 14, 0.8) 100%); border: 1px solid rgba(245, 185, 69, 0.65);`
- **Glow Elevation:** `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(229, 169, 60, 0.15);`

---

## Components

### Átomos
- `.btn`: Base com altura de 42px, tipografia Sora 600, transição suave de 0.2s e borda arredondada de 10px.
- `.btn-gold`: Gradiente suave dourado com texto escuro de alto contraste.
- `.btn-glass`: Fundo translúcido com borda de 1px e hover iluminado.
- `.badge`: Pílulas arredondadas com borda sutil e texto em caixa alta.
- `.input`: Altura consistente de 44px, fundo `--d700`, borda `--glass-b` e anel dourado no foco.

### Moléculas
- `.search-field`: Campo de busca com ícone de lupa embutido e botão de limpeza instantânea (✕).
- `.stepper-step`: Nó numerado conectado com linha dinâmica de progresso.
- `.timeline-card`: Bloco de status com 3 nós e parecer da Diretoria.

### Organismos
- `.server-top-ticker`: Barra fixa superior de status FiveM e cópia de IP.
- `.site-header`: Menu de navegação responsivo com gaveta mobile fluida.
- `.penal-calculator`: Ferramenta lateral fixa com soma de meses, multas e verificação de fiança.
- `.modal-box`: Caixas de diálogo modais centralizadas com backdrop blur escuro.

---

## Do's and Don'ts
- ✅ **DO:** Utilizar sempre as variáveis semânticas de cor (`var(--gold)`, `var(--d900)`).
- ✅ **DO:** Manter alinhamento rigoroso nos eixos da grade de 8px.
- ✅ **DO:** Garantir que todo botão tenha estado `:hover`, `:active`, `:focus-visible` e `:disabled`.
- ❌ **DON'T:** Usar cores hexadecimais soltas no CSS dos componentes.
- ❌ **DON'T:** Misturar fontes arbitrárias que não sejam Sora, Rajdhani ou JetBrains Mono.
- ❌ **DON'T:** Criar bordas brancas opacas e duras — use sempre transparência calibrada (`rgba(255, 255, 255, 0.08)`).
