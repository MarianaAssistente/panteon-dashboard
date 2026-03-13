#!/usr/bin/env node
const { Client } = require('pg');
const DB = 'postgresql://postgres:Yl02041518%40..@db.duogqvusxueetapcvsfp.supabase.co:5432/postgres';

const items = [
  // ── Credenciais ──────────────────────────────────────────────────────────
  {
    title: 'Meta Graph API — STM Capital Instagram',
    content: 'Instagram Business Account ID: 17841461260950333. Facebook Page ID: 1055433797650003. App ID: 1993275764902945. Page Access Token permanente: TOKEN_REDACTED. Endpoint: POST https://graph.facebook.com/v25.0/17841461260950333/media. Conta: yuri.moraes@stmgroup.com.br.',
    category: 'credencial',
    tags: ['meta','instagram','facebook','stm-capital','api'],
    importance: 'crítico',
    related_project_code: 'CAP-001',
  },
  {
    title: 'fal.ai — Geração de Vídeos IA',
    content: 'API Key: FAL_KEY_REDACTED. Conta: yuri.moraes@outlook.com.br. Créditos: $0 (recarregar conforme necessário). Modelos disponíveis: Veo 3.1, Seedance 2.0, Kling, Nano Banana 2. Endpoint base: https://fal.run. Uso: geração de vídeos curtos para redes sociais.',
    category: 'credencial',
    tags: ['fal','video','ia','geracao','api'],
    importance: 'alto',
  },
  {
    title: 'Creatomate — Edição de Vídeo API',
    content: 'API Key: CREATOMATE_KEY_REDACTED337e6d0d09c3678e396cb28d9daa. Project ID: fa7abf10-aa32-4241-a258-665912dfb8cf. API Base: https://api.creatomate.com/v1. Template Highlighted Subtitles ID: 987b4d6e-8e4a-4ac9-a076-73866ebdc5ec. Uso: edição automática de vídeos com legendas destacadas, montagem e renderização cloud.',
    category: 'credencial',
    tags: ['creatomate','video','edicao','legendas','api'],
    importance: 'alto',
  },
  {
    title: 'Hedra Character-3 — Avatar Lip Sync',
    content: 'API Key: HEDRA_KEY_REDACTED. Base URL: https://api.hedra.com. Uso: enviar foto de rosto + arquivo de áudio → gerar vídeo avatar falante com lip sync realista. Conta: yuri.moraes@outlook.com.br.',
    category: 'credencial',
    tags: ['hedra','avatar','lip-sync','video','ia','api'],
    importance: 'alto',
  },
  {
    title: 'GitHub — MarianaAssistente',
    content: 'Token: ghp_REDACTED. Expira: 2026-06-06. Username: MarianaAssistente. Repos ativos: stmgroup-site (site institucional), panteon-dashboard (dashboard Next.js), stmcapital-legal (política de privacidade). GitHub Pages: marianaassistente.github.io. Uso: git push via token no header Authorization.',
    category: 'credencial',
    tags: ['github','git','token','repos','pages'],
    importance: 'crítico',
  },
  {
    title: 'Gemini API — Geração de Imagens',
    content: 'API Key: AIzaSy_REDACTED. Var de ambiente: GEMINI_API_KEY. Script de geração: /home/ceo-mariana/.openclaw/workspace/shared/mediagen.sh "descrição" nome_arquivo. Output padrão: /home/ceo-mariana/shared/media/. Modelo: gemini-2.0-flash-preview-image-generation (ou imagen-3.0). Conta: yuri.moraes@stmgroup.com.br.',
    category: 'credencial',
    tags: ['gemini','google','imagens','ia','api','mediagen'],
    importance: 'alto',
  },
  // ── Lições Aprendidas ────────────────────────────────────────────────────
  {
    title: 'SVG inline fills ignoram @media print — usar prop isPrinting',
    content: 'Problema: atributos fill inline em SVG NÃO são sobrescritos por CSS @media print mesmo com !important (ex: svg rect { fill: white !important } apaga todas as barras do Gantt). Solução correta: passar prop isPrinting={boolean} ao componente React e usar ternário diretamente em cada atributo fill/stroke do SVG. Nunca tentar sobrescrever fills SVG inline via CSS puro. Commit corretivo: c2e1cd4 no panteon-dashboard (2026-03-13).',
    category: 'processo',
    tags: ['svg','print','css','react','gantt','bug'],
    importance: 'alto',
    related_project_code: 'INT-001',
  },
  {
    title: 'WAL Protocol — escrever antes de responder',
    content: 'Antes de responder qualquer mensagem, escanear por: correções, preferências explícitas, decisões, valores específicos (datas, IDs, nomes, preços). Se encontrar qualquer um desses: PARAR → ESCREVER no arquivo de memória correto → DEPOIS responder. A urgência de responder é o inimigo do registro. Implementação: AGENTS.md seção SESSION INITIALIZATION RULE. Incorporado em 2026-03-13. Autor: halthelobster (Proactive Agent v3.1.0).',
    category: 'processo',
    tags: ['wal','protocolo','memoria','registro','agentes'],
    importance: 'alto',
  },
  {
    title: 'PDF export: Yuri prefere fundo branco, nunca dark mode',
    content: 'Qualquer exportação PDF ou impressão gerada para o Yuri DEVE usar fundo branco (#FFFFFF), texto escuro (#1a1a1a), cores de destaque apenas para dados (barras, badges). Dark mode é exclusivo para interfaces de tela. Ao implementar qualquer feature com print/export, criar a versão light-mode desde o início — não é afterthought. CSS: @media print { body { background: white !important; color: #1a1a1a !important; } }. Registrado após feedback em 2026-03-13.',
    category: 'processo',
    tags: ['pdf','print','dark-mode','light-mode','yuri','preferencia'],
    importance: 'alto',
  },
];

async function run() {
  const c = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('✅ Conectado ao Supabase');

  // Get current max code number
  const { rows } = await c.query(`SELECT code FROM knowledge WHERE code LIKE 'KNW-%' ORDER BY code DESC LIMIT 1`);
  let nextNum = 22;
  if (rows.length > 0) {
    const match = rows[0].code.match(/KNW-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  for (const item of items) {
    // Check if already exists by title
    const { rows: existing } = await c.query(`SELECT id FROM knowledge WHERE title = $1 LIMIT 1`, [item.title]);
    if (existing.length > 0) {
      console.log(`⏭️  Já existe: "${item.title}"`);
      continue;
    }

    const code = `KNW-${String(nextNum).padStart(3, '0')}`;
    nextNum++;

    await c.query(
      `INSERT INTO knowledge (code, title, content, category, tags, importance, related_project_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [code, item.title, item.content, item.category,
       item.tags ?? [], item.importance, item.related_project_code ?? null]
    );
    console.log(`✅ ${code} — ${item.title.slice(0,50)}`);
  }

  await c.end();
  console.log('\n🔥 Knowledge seed concluído!');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
