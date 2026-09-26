import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

function renderAt(session) {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <p>Secret dashboard</p>
            </ProtectedRoute>
          }
        />
        <Route path="/homepage" element={<p>Homepage</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when there is a session', () => {
    renderAt({ user: { id: 'abc' } })
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })

  it('redirects to /homepage when there is no session', () => {
    renderAt(null)
    expect(screen.getByText('Homepage')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })
})
