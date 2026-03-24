import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'standby'
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done' | 'blocked'
export type ApprovalStatus = 'pending' | 'approved' | 'adjusted' | 'rejected' | null
export type DeliverableType = 'video' | 'image' | 'text' | 'document' | 'link'
export type DeliveryStatus = 'pending_approval' | 'approved' | 'rejected'

export interface Agent {
  id: string
  name: string
  role: string
  model: string
  avatar_url?: string
  status: AgentStatus
  created_at: string
}

export interface Task {
  id: string
  code?: string
  title: string
  description?: string
  agent_id?: string
  status: TaskStatus
  approval_status?: ApprovalStatus
  feedback?: string
  deliverable_url?: string
  deliverable_type?: DeliverableType
  messages?: Array<{ role: string; content: string; ts: string }>
  execution_time_minutes?: number
  vertical?: string
  priority: 1 | 2 | 3
  notion_id?: string
  trello_id?: string
  created_at: string
  updated_at: string
  completed_at?: string
  agents?: Agent
}

export interface Delivery {
  id: string
  task_id?: string
  agent_id?: string
  title: string
  description?: string
  drive_url?: string
  status: DeliveryStatus
  created_at: string
  agents?: Agent
  tasks?: Task
}

export interface DailyMetric {
  id: string
  date: string
  agent_id?: string
  tasks_completed: number
  deliveries_made: number
  estimated_cost_usd: number
  notes?: string
  created_at: string
  agents?: Agent
}

// ─── Hardcoded agent catalogue (fallback when Supabase is empty) ──────────────

export const AGENTS_STATIC: Agent[] = [
  { id: 'mariana',  name: 'Mariana',  role: 'CEO', model: 'claude-sonnet-4-6', status: 'working',  created_at: '' },
  { id: 'atena',    name: 'Atena',    role: 'CSO', model: 'claude-sonnet-4-6', status: 'idle',     created_at: '' },
  { id: 'hefesto',  name: 'Hefesto',  role: 'CTO', model: 'claude-sonnet-4-6', status: 'working',  created_at: '' },
  { id: 'apollo',   name: 'Apollo',   role: 'CCO', model: 'claude-haiku-4-5',  status: 'working',  created_at: '' },
  { id: 'afrodite', name: 'Afrodite', role: 'CMO', model: 'claude-haiku-4-5',  status: 'idle',     created_at: '' },
  { id: 'hera',     name: 'Hera',     role: 'COO', model: 'claude-haiku-4-5',  status: 'idle',     created_at: '' },
  { id: 'ares',     name: 'Ares',     role: 'CQO', model: 'claude-sonnet-4-6', status: 'idle',     created_at: '' },
  { id: 'hestia',   name: 'Héstia',   role: 'CPA', model: 'claude-haiku-4-5',  status: 'idle',     created_at: '' },
]
