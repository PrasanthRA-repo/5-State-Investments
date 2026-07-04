import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in the console rather than silently doing nothing --
  // copy .env.example to .env and fill in your project's values.
  console.error(
    'Missing Supabase environment variables. Copy .env.example to .env and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from your Supabase project settings (Project Settings > API).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
