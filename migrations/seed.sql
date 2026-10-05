-- ============================================================================
-- DISTRITO PAULISTA RP — SEED INICIAL (CLOUDFLARE D1)
-- ============================================================================

-- 1. Matriz de Permissões RBAC Oficial
INSERT OR REPLACE INTO `permissions_matrix` (`permission_key`, `label`, `suporte`, `moderador`, `administrador`, `gerente`, `diretor`, `ceo`, `updated_at`, `updated_by`)
VALUES
  ('can_view_applications', 'Visualizar Candidaturas de Staff', 0, 1, 1, 1, 1, 1, datetime('now'), 'system'),
  ('can_review_applications', 'Aprovar / Recusar / Avaliar Candidaturas', 0, 0, 0, 1, 1, 1, datetime('now'), 'system'),
  ('can_delete_applications', 'Excluir Candidaturas do Sistema', 0, 0, 0, 0, 1, 1, datetime('now'), 'system'),
  ('can_edit_rules', 'Modificar e Publicar Regras da Cidade', 0, 0, 0, 0, 1, 1, datetime('now'), 'system'),
  ('can_manage_staff', 'Promover / Rebaixar / Gerenciar Membros', 0, 0, 0, 0, 1, 1, datetime('now'), 'system'),
  ('can_create_accounts', 'Criar Novos Logins de Staff', 0, 0, 0, 0, 0, 1, datetime('now'), 'system'),
  ('can_view_audit_logs', 'Acessar Trilha de Auditoria', 0, 0, 0, 1, 1, 1, datetime('now'), 'system'),
  ('can_clear_audit_logs', 'Limpar Histórico de Auditoria', 0, 0, 0, 0, 0, 1, datetime('now'), 'system');

-- 2. Regras Oficiais da Cidade
INSERT OR REPLACE INTO `rules` (`category`, `title`, `content`, `updated_at`, `updated_by`)
VALUES
(
  'gerais',
  'Regras Gerais da Cidade — Distrito Paulista RP',
  '1. Respeito Mútuo: O RP deve estar sempre acima de divergências pessoais. Ofensas OOC (fora do personagem), preconceito ou assédio resultarão em banimento permanente.
2. Proibido Metagaming (MG): É estritamente proibido utilizar informações obtidas fora do jogo (Discord, transmissões, lives, chats) dentro do RP.
3. Proibido Powergaming (PG): Não realize ações impossíveis na vida real, abusar de animações ou forçar situações sem chances de reação justa para o outro player.
4. Proibido VDM (Vehicle Deathmatch): Proibido utilizar veículos como armas ou atropelar deliberadamente outros cidadãos sem justificativa válida de RP.
5. Proibido RDM (Random Deathmatch): Proibido agredir ou matar qualquer jogador sem motivo plausível e sem desenvolvimento prévio de diálogo/ação de RP.
6. Proibido Combat Logging (CL): Desconectar do servidor ou forçar crash durante abordagens policiais, tiroteios, sequestros ou interações de RP em andamento.
7. Amor à Vida: Em situações de desvantagem manifesta (ex: mira na cabeça, encurralado por três armados), você deve render-se e valorizar a vida do seu personagem.
8. Dark RP Restrito: Atos como tortura extrema, assédio, estupro ou gore são terminantemente proibidos e acarretam expulsão imediata do servidor.',
  datetime('now'),
  'system'
),
(
  'policia',
  'Diretrizes e Regras da Polícia — Forças de Segurança SP',
  '1. Uso Progressivo da Força: A autoridade policial deve iniciar pela presença ostensiva e verbalização, progredindo para armamento não-letal e uso letal apenas sob ameaça iminente à vida.
2. Abordagem com Justificativa: Nenhuma revista ou enquadro pode ser feito sem fundada suspeita (infrações visíveis de trânsito, denúncia formal, atitude suspeita ou alerta emitido).
3. Respeito ao Código Q e Rádio: O uso de frequências de rádio oficial deve manter compostura militar, sem ruídos, gritos ou brincadeiras durante o patrulhamento.
4. Procedimento de Prisão: Leitura obrigatória dos Direitos Constitucionais (Direitos de Miranda) no momento da voz de prisão antes da condução à DP.
5. Abuso de Autoridade e Corrupção: Qualquer ato de corrupção ou favorecimento ilícito só é permitido se previamente autorizado e homologado pela Diretoria do servidor.
6. Negociação em Roubos: Em ocorrências de roubo com reféns, a vida do refém é a prioridade absoluta da guarnição. Não abrir fogo enquanto houver risco direto ao civil.
7. Armamento e Viaturas: É vedado o empréstimo, venda ou descarte de equipamentos e viaturas da corporação para membros civis ou ilegais.',
  datetime('now'),
  'system'
),
(
  'ilegal',
  'Regras do Crime, Facções e Submundo Ilegal',
  '1. Contexto em Ações Criminosas: Todo assalto, sequestro ou cobrança armada exige uma justificativa plausível e desenvolvimento de enredo criminal dentro do RP.
2. Limite de Membros em Ações: Respeite o teto numérico de participantes definido pelo regulamento: Lojas de Conveniência (max 4), Bancos Pequenos (max 6), Banco Central (max 10).
3. Proibido Revenge Kill (RK): Se o seu personagem for finalizado e receber atendimento médico com perda de memória, é vedado voltar à mesma ação para se vingar.
4. Sequestros e Reféns: Proibido utilizar ''refém falso'' ou amigos em call para facilitar negociação em ações criminosas.
5. Disputas de Território: Guerras entre facções devem ser comunicadas e validadas pela Administração/Gerência com definição clara de horários e regras de combate.
6. Respeito às Safezones: É estritamente proibido roubar, sequestrar, iniciar tiroteios ou fugir para locais seguros (Hospitais, Concessionárias, Delegacias e Centrais de Emprego).
7. Saque de Itens (Looting): Permitido saquear apenas armas e itens usados na ação. É proibido obrigar jogadores a sacar dinheiro em caixas eletrônicos sob ameaça.',
  datetime('now'),
  'system'
),
(
  'codigo_penal',
  'Código Penal Unificado — Distrito Paulista RP',
  'Art. 121 - Homicídio Doloso: Pena: 40 a 60 meses de reclusão + Multa de R$ 50.000 (Inafiançável).
Art. 121 § 1º - Tentativa de Homicídio: Pena: 25 a 35 meses de reclusão + Multa de R$ 30.000.
Art. 129 - Lesão Corporal Grave: Pena: 15 a 20 meses de reclusão + Multa de R$ 15.000.
Art. 155 - Furto Simples e Qualificado: Pena: 10 a 20 meses de reclusão + Multa de R$ 10.000 a R$ 25.000.
Art. 157 - Roubo / Assalto à Mão Armada: Pena: 25 a 45 meses de reclusão + Multa de R$ 35.000.
Art. 148 - Sequestro e Cárcere Privado: Pena: 35 a 50 meses de reclusão + Multa de R$ 40.000.
Art. 33 - Tráfico Ilícito de Drogas e Entorpecentes: Pena: 30 a 50 meses de reclusão + Multa proporcional à quantidade.
Art. 14/16 - Porte e Posse Ilegal de Arma de Fogo: Pena: 20 a 35 meses de reclusão + Apreensão do armamento + Multa de R$ 25.000.
Art. 329 - Resistência à Prisão e Fuga Policial: Pena: 15 a 25 meses de reclusão + Multa de R$ 20.000.
Art. 331 - Desacato a Funcionário Público: Pena: 10 a 20 meses de reclusão + Multa de R$ 15.000.
Art. 333 - Corrupção Ativa / Tentativa de Suborno: Pena: 20 a 30 meses de reclusão + Multa de R$ 30.000.
Art. 308 - Racha / Direção Perigosa em Via Pública: Pena: 10 a 15 meses de reclusão + Apreensão do veículo + Multa de R$ 15.000.',
  datetime('now'),
  'system'
),
(
  'historia',
  'História Oficial e Lore da Cidade — Distrito Paulista RP',
  'Prólogo: O Renascimento Urbano de São Paulo
No coração da maior metrópole da América Latina, entre os arranha-céus iluminados da Avenida Paulista e os cartões-postais da Ponte Estaiada, ergue-se o Distrito Paulista: um território onde a lei e a ambição colidem diariamente.
Capítulo 1: A Linha Tênue entre o Luxo e o Asfalto
Fundada sob os pilares do empreendedorismo e da imersão automobilística, a cidade atraiu investidores bilionários, dinastias empresariais e cidadãos em busca de uma nova vida. Ao mesmo tempo, o crescimento vertiginoso abriu espaço para redes complexas do submundo do crime organizado, exigindo uma reestruturação das forças da lei.
Capítulo 2: As Forças de Segurança Pública
Com a criação do Comando Unificado das Forças de Segurança, os batalhões de elite da Polícia Militar e Civil foram equipados com tecnologia de ponta para patrulhar desde os bairros nobres até as comunidades da periferia, preservando a paz dos civis que movimentam a economia formal.
Capítulo 3: A Era Atual e o Seu Papel
Hoje, cada esquina do Distrito Paulista respira história. Seja na farda honrada da polícia, nos tribunais de justiça, nos leitos do hospital, nas garagens customizadas ou nas operações arriscadas do submundo, o seu destino é escrito a cada decisão. Bem-vindo à cidade que nunca dorme.',
  datetime('now'),
  'system'
);

-- 3. Contas Seed dos 6 Níveis de Staff (Senha padrão: Senha@123)
-- Hash PBKDF2: 3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb
-- Salt: 5bf47889565f815338027e1b6dee6c81
INSERT OR REPLACE INTO `profiles` (`id`, `email`, `password_hash`, `salt`, `display_name`, `role`, `avatar_url`, `status`, `created_at`, `updated_at`)
VALUES
  ('usr-ceo-01', 'ceo@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'CEO Arthur', 'ceo', '👑', 'active', datetime('now'), datetime('now')),
  ('usr-dir-02', 'diretor@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'Diretor Marcos', 'diretor', '⚜️', 'active', datetime('now'), datetime('now')),
  ('usr-ger-03', 'gerente@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'Gerente Bruno', 'gerente', '💼', 'active', datetime('now'), datetime('now')),
  ('usr-adm-04', 'admin@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'Admin Rafael', 'administrador', '⚖️', 'active', datetime('now'), datetime('now')),
  ('usr-mod-05', 'moderador@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'Moderador Thiago', 'moderador', '🛡️', 'active', datetime('now'), datetime('now')),
  ('usr-sup-06', 'suporte@distritopaulista.com', '3ebbaff98d144e29774671d209107d4f56e7c428ebe8e534aa8a45c0798c68eb', '5bf47889565f815338027e1b6dee6c81', 'Suporte Lucas', 'suporte', '🎧', 'active', datetime('now'), datetime('now'));

-- 4. Log Inicial de Auditoria
INSERT OR REPLACE INTO `audit_logs` (`id`, `action`, `user_id`, `user_name`, `details`, `created_at`)
VALUES
  ('log-init-01', 'SYSTEM_BOOT', 'usr-ceo-01', 'CEO Arthur', 'Ecossistema Hono-DP no Cloudflare Edge inicializado com sucesso.', datetime('now'));
