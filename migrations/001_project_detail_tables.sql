-- Migration 001: Tabelas de detalhes de projeto
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/duogqvusxueetapcvsfp/sql

-- Tabela de milestones/marco do projeto (para Gantt)
CREATE TABLE IF NOT EXISTS project_milestones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  status          text DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','done','delayed')),
  baseline_start  date,
  baseline_end    date,
  forecast_start  date,
  forecast_end    date,
  actual_start    date,
  actual_end      date,
  depends_on      uuid[] DEFAULT '{}',
  order_index     int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- Tabela de documentos do projeto
CREATE TABLE IF NOT EXISTS project_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  category    text DEFAULT 'geral'
                CHECK (category IN ('estrategia','tecnico','comercial','financeiro','operacional','geral')),
  file_type   text DEFAULT 'link',
  drive_url   text,
  drive_path  text,
  created_at  timestamptz DEFAULT now()
);

-- RLS: permitir leitura pública (igual ao restante do schema)
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read" ON project_milestones FOR SELECT USING (true);
CREATE POLICY "Allow read" ON project_documents  FOR SELECT USING (true);
CREATE POLICY "Allow service write" ON project_milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write" ON project_documents  FOR ALL USING (true) WITH CHECK (true);

-- Dados piloto: AGI-001 (AgiSales CRM — id: bdb36364-34c6-4c81-808c-52c689de6913)
INSERT INTO project_milestones (project_id, name, status, baseline_start, baseline_end, forecast_start, forecast_end, order_index)
VALUES
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Discovery & Requisitos',     'done',       '2026-02-01','2026-02-14','2026-02-01','2026-02-14', 1),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Arquitetura & Stack',        'done',       '2026-02-10','2026-02-21','2026-02-10','2026-02-21', 2),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'MVP Backend — API Core',     'in_progress','2026-02-17','2026-03-07','2026-02-17','2026-03-14', 3),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'MVP Frontend — Dashboard',   'in_progress','2026-03-01','2026-03-21','2026-03-05','2026-03-28', 4),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Integração CRM Externo',     'pending',    '2026-03-10','2026-03-24','2026-03-18','2026-04-01', 5),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'QA & Testes de Carga',       'pending',    '2026-03-21','2026-04-04','2026-03-28','2026-04-11', 6),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Beta Fechado (10 clientes)', 'pending',    '2026-04-01','2026-04-18','2026-04-08','2026-04-25', 7),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Launch Público',             'pending',    '2026-04-21','2026-04-21','2026-04-28','2026-04-28', 8)
ON CONFLICT DO NOTHING;

INSERT INTO project_documents (project_id, title, category, file_type, drive_url)
VALUES
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'PRD — Documento de Requisitos', 'estrategia', 'doc',   'https://drive.google.com/placeholder-prd'),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Arquitetura Técnica v1',         'tecnico',    'doc',   'https://drive.google.com/placeholder-arch'),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Pitch Deck AgiSales',            'comercial',  'slide', 'https://drive.google.com/placeholder-pitch'),
  ('bdb36364-34c6-4c81-808c-52c689de6913', 'Modelo Financeiro 2026',         'financeiro', 'sheet', 'https://drive.google.com/placeholder-fin')
ON CONFLICT DO NOTHING;
