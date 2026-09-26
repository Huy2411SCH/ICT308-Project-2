import { describe, it, expect, vi } from 'vitest'

// Mock Supabase so importing filesService doesn't need env vars or a network.
vi.mock('../supabaseClient', () => ({ supabase: {} }))
vi.mock('../apiAuth', () => ({ apiHeaders: vi.fn() }))

const { normalizeDbFile } = await import('../filesService')

describe('normalizeDbFile', () => {
  it('adds a formatted date from created_at', () => {
    const row = { id: 1, name: 'meeting.mp3', created_at: '2026-03-15T12:00:00Z' }
    const result = normalizeDbFile(row)
    expect(result.date).toBe('Mar 15, 2026')
  })

  it('keeps all original fields', () => {
    const row = { id: 7, name: 'notes.txt', type: 'transcript', created_at: '2026-01-01T12:00:00Z' }
    expect(normalizeDbFile(row)).toMatchObject(row)
  })

  it('uses an empty date when created_at is missing', () => {
    expect(normalizeDbFile({ id: 2 }).date).toBe('')
  })
})
