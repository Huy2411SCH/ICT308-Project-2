import { supabase } from './supabaseClient'

// Headers for requests to our backend, which uses the Supabase access token
// to check that the signed-in user owns the file being processed.
export async function apiHeaders() {
  const { data } = await supabase.auth.getSession()
  const headers = { 'Content-Type': 'application/json' }
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`
  return headers
}
