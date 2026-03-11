-- ============================================================
-- Panteão do Olimpo — Schema SQL
-- Aplicar no Supabase > SQL Editor
-- ============================================================

-- Agentes
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  model TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'idle', -- idle | working | blocked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas (MVP completo)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT REFERENCES agents(id),
  status TEXT DEFAULT 'backlog',         -- backlog | in_progress | review | done | blocked
  approval_status TEXT DEFAULT NULL,     -- pending | approved | adjusted | rejected
  feedback TEXT,                         -- observações do Yuri ao aprovar/rejeitar
  deliverable_url TEXT,                  -- link do entregável
  deliverable_type TEXT,                 -- video | image | text | document | link
  messages JSONB DEFAULT '[]'::jsonb,    -- histórico de mensagens do agente
  execution_time_minutes INTEGER,
  vertical TEXT,                         -- STM Capital | STM Digital | STM Consultancy | STM Health | AgiSales | Interno
  priority INTEGER DEFAULT 2,            -- 1=alta, 2=média, 3=baixa
  notion_id TEXT,
  trello_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Entregas
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  agent_id TEXT REFERENCES agents(id),
  title TEXT NOT NULL,
  description TEXT,
  drive_url TEXT,
  status TEXT DEFAULT 'pending_approval', -- pending_approval | approved | rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Métricas diárias
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_id TEXT REFERENCES agents(id),
  tasks_completed INTEGER DEFAULT 0,
  deliveries_made INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seeds — 8 Agentes ───────────────────────────────────────────────────────
INSERT INTO agents (id, name, role, model, status) VALUES
  ('mariana',  'Mariana',  'CEO', 'claude-sonnet-4-6', 'working'),
  ('atena',    'Atena',    'CSO', 'claude-sonnet-4-6', 'idle'),
  ('hefesto',  'Hefesto',  'CTO', 'claude-sonnet-4-6', 'working'),
  ('apollo',   'Apollo',   'CCO', 'claude-haiku-4-5',  'working'),
  ('afrodite', 'Afrodite', 'CMO', 'claude-haiku-4-5',  'idle'),
  ('hera',     'Hera',     'COO', 'claude-haiku-4-5',  'idle'),
  ('ares',     'Ares',     'CQO', 'claude-sonnet-4-6', 'idle'),
  ('hestia',   'Héstia',   'CPA', 'claude-haiku-4-5',  'idle')
ON CONFLICT (id) DO NOTHING;

-- ─── RLS — habilitar (opcional, ajuste conforme autenticação) ─────────────────
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Para dev sem auth, permitir acesso público:
-- CREATE POLICY "allow_all" ON agents FOR ALL USING (true);
-- CREATE POLICY "allow_all" ON tasks FOR ALL USING (true);
-- CREATE POLICY "allow_all" ON deliveries FOR ALL USING (true);
-- CREATE POLICY "allow_all" ON daily_metrics FOR ALL USING (true);
