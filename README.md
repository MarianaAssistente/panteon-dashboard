# Panteão do Olimpo — Dashboard

Dashboard de gestão do Panteão do Olimpo · STM Group

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase (PostgreSQL)

---

## Deploy (Vercel)

### 1. Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) → New project
2. Anote a **Project URL** e a **anon public key** (Settings → API)
3. No SQL Editor, execute o conteúdo de `lib/schema.sql`

### 2. Deploy no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `MarianaAssistente/panteon-dashboard`
3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. Clique em **Deploy** ✓

### 3. (Opcional) Domínio personalizado

Em Vercel → Settings → Domains, adicione `dashboard.stmgroup.com.br`

---

## Dev local

```bash
cp .env.example .env.local
# Preencha com suas credenciais Supabase

npm install
npm run dev
# Abra http://localhost:3000
```

---

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard — visão geral dos 8 agentes, contadores de tarefas, custo |
| `/tasks` | Fila kanban com filtros por agente, vertical e status |
| `/approvals` | Central de aprovações — preview inline + Aprovar / Ajustar / Rejeitar |
| `/history` | Timeline de entregas, custo por agente, export |

---

## Estrutura de dados

Ver `lib/schema.sql` para o schema completo com todos os campos do MVP.

**Tabelas:**
- `agents` — 8 agentes do Panteão (hardcoded no código como fallback)
- `tasks` — tarefas com status, approval_status, deliverable_url, messages (JSONB)
- `deliveries` — entregas formais
- `daily_metrics` — custo e produtividade por dia/agente

---

## Como os agentes gravam dados

Os agentes do Panteão devem usar a Supabase REST API ou o client JS para:

```bash
# Criar tarefa (via curl)
curl -s -X POST "$SUPABASE_URL/rest/v1/tasks" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Criar e-book STM Capital v2",
    "agent_id": "apollo",
    "status": "in_progress",
    "approval_status": "pending",
    "vertical": "STM Capital",
    "priority": 1,
    "deliverable_url": "https://drive.google.com/...",
    "deliverable_type": "document"
  }'
```

---

*Hefesto (CTO) · STM Group · 2026*
