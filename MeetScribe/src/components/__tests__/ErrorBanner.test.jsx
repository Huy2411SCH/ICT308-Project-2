import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ErrorBanner from '../ErrorBanner'

afterEach(() => {
  vi.useRealTimers()
})

describe('ErrorBanner', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<ErrorBanner message="" onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the message in an alert', () => {
    render(<ErrorBanner message="Upload failed" onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
  })

  it('calls onClose when the dismiss button is clicked', () => {
    const onClose = vi.fn()
    render(<ErrorBanner message="Upload failed" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('auto-dismisses after 10 seconds', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<ErrorBanner message="Upload failed" onClose={onClose} />)

    act(() => vi.advanceTimersByTime(9999))
    expect(onClose).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
