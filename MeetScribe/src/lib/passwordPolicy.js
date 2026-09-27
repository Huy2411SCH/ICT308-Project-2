// Client-side password rules, matching Supabase Auth's minimum password length
// and "lowercase, uppercase letters, digits and symbols" requirement (also set in
// supabase/config.toml) so users see a clear message instead of a weak_password error.
export const MIN_PASSWORD_LENGTH = 12

export const PASSWORD_HINT =
  `At least ${MIN_PASSWORD_LENGTH} characters, including an uppercase letter, a lowercase letter, a number and a special character`

// Returns an error message, or null if the password meets every rule.
export function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter'
  if (!/\d/.test(password)) return 'Password must include at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character (e.g. ! @ # $)'
  }
  return null
}
