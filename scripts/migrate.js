#!/usr/bin/env node
// Migration + seed script — executa direto no Supabase via pg
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:Yl02041518%40..@db.duogqvusxueetapcvsfp.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado ao Supabase');

  // ── 1. Criar tabelas ──────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_milestones (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id        uuid REFERENCES projects(id) ON DELETE CASCADE,
      name              text NOT NULL,
      status            text DEFAULT 'pending'
                          CHECK (status IN ('pending','in_progress','done','delayed')),
      assignee_agent_id text,
      baseline_start    date,
      baseline_end      date,
      forecast_start    date,
      forecast_end      date,
      actual_start      date,
      actual_end        date,
      depends_on        uuid[] DEFAULT '{}',
      order_index       int DEFAULT 0,
      created_at        timestamptz DEFAULT now()
    );
  `);
  console.log('✅ Tabela project_milestones criada/existente');

  await client.query(`
    CREATE TABLE IF NOT EXISTS project_documents (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
      title       text NOT NULL,
      category    text DEFAULT 'geral'
                    CHECK (category IN ('estrategia','tecnico','comercial','financeiro','operacional','geral')),
      file_type   text DEFAULT 'link',
      drive_url   text,
      drive_path  text,
      notes       text,
      created_at  timestamptz DEFAULT now()
    );
  `);
  console.log('✅ Tabela project_documents criada/existente');

  // RLS
  await client.query(`
    ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
    ALTER TABLE project_documents  ENABLE ROW LEVEL SECURITY;
  `).catch(() => {});

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_milestones' AND policyname='Allow read') THEN
        CREATE POLICY "Allow read" ON project_milestones FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_milestones' AND policyname='Allow service write') THEN
        CREATE POLICY "Allow service write" ON project_milestones FOR ALL USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_documents' AND policyname='Allow read') THEN
        CREATE POLICY "Allow read" ON project_documents FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_documents' AND policyname='Allow service write') THEN
        CREATE POLICY "Allow service write" ON project_documents FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `).catch((e) => console.warn('RLS policies warning:', e.message));
  console.log('✅ RLS configurado');

  // ── 2. Upsert projeto AGI-001 ─────────────────────────────────────────────
  const projRes = await client.query(`
    INSERT INTO projects (name, description, vertical, status, phase, priority, lead_agent_id, progress, code, tags)
    VALUES (
      'AgiSales — Motor de Vendas',
      'Plataforma de automação de vendas com IA para PMEs brasileiras — funil, playbook e KPIs integrados',
      'AgiSales', 'active', 'desenvolvimento', 1, 'hefesto', 30, 'AGI-001',
      ARRAY['saas','vendas','automacao','ia','crm']
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      progress = EXCLUDED.progress,
      updated_at = now()
    RETURNING id, name, code;
  `).catch(async () => {
    // Se não houver constraint unique em code, fazer upsert manual
    const existing = await client.query(`SELECT id FROM projects WHERE code = 'AGI-001'`);
    if (existing.rows.length > 0) {
      await client.query(`UPDATE projects SET name='AgiSales — Motor de Vendas', progress=30, updated_at=now() WHERE code='AGI-001'`);
      return { rows: existing.rows };
    }
    return await client.query(`
      INSERT INTO projects (name, description, vertical, status, phase, priority, lead_agent_id, progress, code, tags)
      VALUES ('AgiSales — Motor de Vendas','Plataforma de automação de vendas com IA para PMEs','AgiSales','active','desenvolvimento',1,'hefesto',30,'AGI-001',ARRAY['saas','vendas','ia'])
      RETURNING id, name, code;
    `);
  });

  const projectId = projRes.rows[0].id;
  console.log(`✅ Projeto AGI-001 id=${projectId}`);

  // ── 3. Inserir milestones ─────────────────────────────────────────────────
  // Limpar milestones antigos deste projeto antes de reinserir
  await client.query(`DELETE FROM project_milestones WHERE project_id = $1`, [projectId]);

  const milestones = [
    { name: 'Diagnóstico Comercial',  status: 'done',        bs: '2026-03-15', be: '2026-03-22', fs: '2026-03-15', fe: '2026-03-22', as_: '2026-03-15', ae: '2026-03-22', agent: 'ares',    idx: 1 },
    { name: 'Definição do Funil',     status: 'done',        bs: '2026-03-23', be: '2026-03-30', fs: '2026-03-23', fe: '2026-03-30', as_: '2026-03-23', ae: null,          agent: 'atena',   idx: 2 },
    { name: 'Playbook de Vendas',     status: 'in_progress', bs: '2026-03-31', be: '2026-04-10', fs: '2026-03-31', fe: '2026-04-12', as_: '2026-03-31', ae: null,          agent: 'apollo',  idx: 3 },
    { name: 'KPIs & Dashboard',       status: 'in_progress', bs: '2026-04-01', be: '2026-04-07', fs: '2026-04-01', fe: '2026-04-09', as_: null,         ae: null,          agent: 'hefesto', idx: 4 },
    { name: 'Treinamento da Equipe',  status: 'pending',     bs: '2026-04-11', be: '2026-04-20', fs: '2026-04-14', fe: '2026-04-23', as_: null,         ae: null,          agent: 'hera',    idx: 5 },
    { name: 'Go Live',                status: 'pending',     bs: '2026-04-21', be: '2026-04-30', fs: '2026-04-24', fe: '2026-04-30', as_: null,         ae: null,          agent: 'mariana', idx: 6 },
  ];

  const insertedIds = [];
  for (const m of milestones) {
    const r = await client.query(`
      INSERT INTO project_milestones
        (project_id, name, status, assignee_agent_id, baseline_start, baseline_end,
         forecast_start, forecast_end, actual_start, actual_end, order_index)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`,
      [projectId, m.name, m.status, m.agent,
       m.bs, m.be, m.fs, m.fe, m.as_ || null, m.ae || null, m.idx]
    );
    insertedIds.push(r.rows[0].id);
    console.log(`  ✅ Milestone [${m.idx}] ${m.name} — id=${r.rows[0].id}`);
  }

  // Encadear dependências (cada milestone depende do anterior)
  for (let i = 1; i < insertedIds.length; i++) {
    await client.query(
      `UPDATE project_milestones SET depends_on = $1 WHERE id = $2`,
      [[insertedIds[i-1]], insertedIds[i]]
    );
  }
  console.log('✅ Dependências encadeadas');

  // ── 4. Inserir documentos de exemplo ─────────────────────────────────────
  await client.query(`DELETE FROM project_documents WHERE project_id = $1`, [projectId]);
  await client.query(`
    INSERT INTO project_documents (project_id, title, category, file_type, drive_url, notes)
    VALUES
      ($1, 'PRD — Requisitos do Motor de Vendas', 'estrategia', 'doc',   'https://drive.google.com/file/placeholder-prd',   'Documento principal de requisitos v1.2'),
      ($1, 'Arquitetura Técnica v1',               'tecnico',    'doc',   'https://drive.google.com/file/placeholder-arch',  'Stack e fluxo de dados'),
      ($1, 'Pitch Deck AgiSales 2026',             'comercial',  'slide', 'https://drive.google.com/file/placeholder-pitch', 'Versão para investidores'),
      ($1, 'Modelo Financeiro 2026',               'financeiro', 'sheet', 'https://drive.google.com/file/placeholder-fin',   'Projeção 18 meses')
  `, [projectId]);
  console.log('✅ Documentos inseridos');

  await client.end();
  console.log('\n🔥 Migration concluída com sucesso!');
  console.log(`   Project ID: ${projectId}`);
}

run().catch(err => {
  console.error('❌ Erro na migration:', err.message);
  process.exit(1);
});
