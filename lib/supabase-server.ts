import { createClient } from '@supabase/supabase-js'

// Cliente server-side com service_role — NUNCA expor ao browser
// Usar apenas em Server Actions e API Routes (arquivos com "use server")
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
