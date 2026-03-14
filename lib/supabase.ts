import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Paste your real values from Supabase Dashboard → Settings → API
const supabaseUrl = 'https://cniggzjuzgywtamizumk.supabase.co'
const supabaseKey = 'sb_publishable_MsqnK6DSPCaQ5B1oLdl71A_Q_lyidYB'

// Free ESV API key from https://api.esv.org
export const ESV_API_KEY = 'Token 3992bfa55cb535a76c737b04a8c3c8098a46eef3'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}
