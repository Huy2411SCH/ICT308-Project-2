import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FileRow from '../FileRow'
import { filesService } from '../../lib/filesService'

// Replace the real service so no Supabase calls are made.
vi.mock('../../lib/filesService', () => ({
  filesService: {
    getFileUrl: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

const baseFile = {
  id: 42,
  name: 'Team standup.mp3',
  type: 'audio',
  status: 'completed',
  date: 'Mar 15, 2026',
  duration: '12:30',
  size: '4.2 MB',
  media_url: 'user/standup.mp3',
}

function renderRow(file = baseFile, onDeleted = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/files']}>
      <Routes>
        <Route path="/files" element={<FileRow file={file} onDeleted={onDeleted} />} />
        <Route path="/files/:id" element={<p>File detail page</p>} />
      </Routes>
    </MemoryRouter>
  )
  return { onDeleted }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('FileRow', () => {
  it('shows the file details', () => {
    renderRow()
    expect(screen.getByText('Team standup.mp3')).toBeInTheDocument()
    expect(screen.getByText('Mar 15, 2026')).toBeInTheDocument()
    expect(screen.getByText('4.2 MB')).toBeInTheDocument()
    expect(screen.getByText('completed')).toHaveClass('badge-completed')
  })

  it('navigates to the detail page when the row is clicked', async () => {
    renderRow()
    await userEvent.click(screen.getByText('Team standup.mp3'))
    expect(screen.getByText('File detail page')).toBeInTheDocument()
  })

  it('disables Download when there is no media_url', () => {
    renderRow({ ...baseFile, media_url: null })
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled()
  })

  it('opens the signed URL when Download is clicked', async () => {
    filesService.getFileUrl.mockResolvedValue('https://example.com/signed')
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: /download/i }))

    expect(filesService.getFileUrl).toHaveBeenCalledWith('user/standup.mp3')
    expect(openSpy).toHaveBeenCalledWith('https://example.com/signed', '_blank', 'noopener')
    // Clicking a button shouldn't also navigate away.
    expect(screen.queryByText('File detail page')).not.toBeInTheDocument()
  })

  it('deletes the file after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    filesService.deleteFile.mockResolvedValue()
    const { onDeleted } = renderRow()

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(filesService.deleteFile).toHaveBeenCalledWith(baseFile)
    expect(onDeleted).toHaveBeenCalled()
  })

  it('does nothing if the delete is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { onDeleted } = renderRow()

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(filesService.deleteFile).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
