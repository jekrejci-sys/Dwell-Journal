import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Paste your real values from Supabase Dashboard → Settings → API
const supabaseUrl = 'https://cniggzjuzgywtamizumk.supabase.co'
const supabaseKey = 'sb_publishable_MsqnK6DSPCaQ5B1oLdl71A_Q_lyidYB'

// Free ESV API key from https://api.esv.org
export const ESV_API_KEY = '1f864b55276267b1bc4958e3de072c281f10fe12'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}
