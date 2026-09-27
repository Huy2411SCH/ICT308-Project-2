import { supabase } from './supabaseClient'
import { apiHeaders } from './apiAuth'

const ACCOUNT_ENDPOINT = 'http://localhost:3001/account' // Change when deployed to production

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
  },
  async deleteAccount() {
    const res = await fetch(ACCOUNT_ENDPOINT, { method: 'DELETE', headers: await apiHeaders() })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Account deletion failed')
    }
    // Sign out the user after account deletion
    await supabase.auth.signOut({ scope: 'local' })
  },
  // Emails a reset link that signs the user in on /reset-password, where they
  // choose a new password. The URL must be in Auth's allowed redirect list.
  async sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },
  // Sets a new password for the signed-in user (used after a reset link).
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
  // Changes the password from Settings. Checks the current password first so
  // someone at an unlocked, signed-in browser can't silently take over the account.
  async changePassword(email, currentPassword, newPassword) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (verifyError?.code === 'invalid_credentials') throw new Error('Current password is incorrect')
    if (verifyError) throw verifyError
    await this.updatePassword(newPassword)
  },
}
