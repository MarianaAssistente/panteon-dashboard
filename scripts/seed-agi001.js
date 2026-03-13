#!/usr/bin/env node
const { Client } = require('pg');
const DB = 'postgresql://postgres:Yl02041518%40..@db.duogqvusxueetapcvsfp.supabase.co:5432/postgres';

async function run() {
  const c = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('✅ Conectado');

  const AGI_ID = 'bdb36364-34c6-4c81-808c-52c689de6913';

  // ── Limpar documentos fictícios ─────────────────────────────────────────
  await c.query(`DELETE FROM project_documents WHERE project_id = $1`, [AGI_ID]);
  console.log('🗑️  Documentos fictícios removidos');

  // ── Criar tasks AGI-001 com project_code ────────────────────────────────
  // Primeiro checar se já existem
  const { rows: existing } = await c.query(`SELECT id FROM tasks WHERE project_code='AGI-001' LIMIT 1`);
  if (existing.length === 0) {
    await c.query(`
      INSERT INTO tasks (title, description, agent_id, status, vertical, project_code, priority, updated_at)
      VALUES
        ('Mapear processo de vendas atual',        'Entrevistar equipe e documentar fluxo atual',   'ares',    'done',        'AgiSales', 'AGI-001', 2, now() - interval '10 days'),
        ('Definir ICP (Ideal Customer Profile)',   'Workshop com time para definir perfil ideal',   'atena',   'done',        'AgiSales', 'AGI-001', 1, now() - interval '8 days'),
        ('Criar estrutura do funil em 5 estágios', 'Prospecção → Qualificação → Proposta → Negocia → Fechamento', 'atena', 'in_progress', 'AgiSales', 'AGI-001', 1, now() - interval '3 days'),
        ('Redigir Playbook v1 — capítulo abordagem', 'Script de cold call + e-mail sequences',     'apollo',  'in_progress', 'AgiSales', 'AGI-001', 2, now() - interval '1 day'),
        ('Configurar CRM pipeline',                'Criar estágios no CRM e mapear campos',        'hefesto', 'in_progress', 'AgiSales', 'AGI-001', 2, now() - interval '2 days'),
        ('Definir KPIs do motor de vendas',        'CAC, LTV, taxa de conversão por estágio',      'hefesto', 'review',      'AgiSales', 'AGI-001', 1, now() - interval '12 hours'),
        ('Criar dashboard de acompanhamento',      'Métricas em tempo real para liderança',        'hefesto', 'backlog',     'AgiSales', 'AGI-001', 2, now()),
        ('Treinamento comercial — módulo 1',       'Onboarding do playbook para time de vendas',   'hera',    'backlog',     'AgiSales', 'AGI-001', 2, now()),
        ('Integrar qualificação com IA (AgiSales)','Lead scoring automático via modelo preditivo', 'hefesto', 'backlog',     'AgiSales', 'AGI-001', 1, now()),
        ('Go Live — ativar motor em produção',     'Rollout para todo time, monitoramento 24h',    'mariana', 'backlog',     'AgiSales', 'AGI-001', 1, now())
    `);
    console.log('✅ 10 tasks AGI-001 criadas');
  } else {
    console.log('ℹ️  Tasks AGI-001 já existem, pulando');
  }

  await c.end();
  console.log('🔥 Seed concluído');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
