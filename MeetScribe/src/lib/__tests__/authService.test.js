// authService.test.js 
// Tests for authService.js
import { describe, it, expect, vi } from 'vitest'

const signUp = vi.fn()
vi.mock('../supabaseClient', () => ({ supabase: { auth: { signUp } } }))
vi.mock('../apiAuth', () => ({ apiHeaders: vi.fn() }))

const { authService } = await import('../authService')

describe('authService.signUp', () => {
  it('rejects an email that is already registered', async () => {
    signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null })
    await expect(authService.signUp('taken@example.com', 'pw')).rejects.toThrow(/already exists/)
  })

  it('returns data for a new email', async () => {
    const data = { user: { identities: [{ id: '1' }] }, session: null }
    signUp.mockResolvedValue({ data, error: null })
    await expect(authService.signUp('new@example.com', 'pw')).resolves.toBe(data)
  })
})
