import { supabase } from './supabaseClient'

export const authService = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },
  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return data
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  async signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  },
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  return data
  }
}
