import { supabase } from './supabaseClient'
import { apiHeaders } from './apiAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const ACCOUNT_ENDPOINT = `${API_URL}/account`

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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
  },
  // Signs up a new user and sends a confirmation email. The URL must be in Auth's
  // allowed redirect list. The user is not signed in until they click the link.
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Redirect to /dashboard after the user clicks the confirmation link in their email.
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
    // Return an error if the user already exists - Supabase returns a 200 with an empty user object in this case.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists. Try logging in instead.')
    }
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
  // Changes the password from Settings. Auth has "Require current password when
  // updating" on, so the server checks current_password before changing it; this
  // stops someone at an unlocked, signed-in browser from taking over the account.
  async changePassword(currentPassword, newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    })
    if (error?.code === 'current_password_invalid') throw new Error('Current password is incorrect')
    if (error) throw error
  },
}
