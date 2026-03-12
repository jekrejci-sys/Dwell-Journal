import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Paste your real values from Supabase Dashboard → Settings → API
const supabaseUrl = 'https://cniggzjuzgywtamizumk.supabase.co'
const supabaseKey = 'sb_publishable_MsqnK6DSPCaQ5B1oLdl71A_Q_lyidYB'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}