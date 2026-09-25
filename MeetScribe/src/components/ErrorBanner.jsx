import { useEffect, useRef } from 'react'
import { XIcon } from './icons'

const AUTO_DISMISS_MS = 10000

// Error message with a close button that also hides itself after a few seconds.
export default function ErrorBanner({ message, onClose }) {
  // Keep the latest onClose without restarting the timer on every parent render.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!message) return
    const timeoutId = setTimeout(() => onCloseRef.current(), AUTO_DISMISS_MS)
    return () => clearTimeout(timeoutId)
  }, [message])

  if (!message) return null

  return (
    <div className="file-list-error error-banner" role="alert">
      <span>{message}</span>
      <button type="button" className="error-banner-close" onClick={onClose} aria-label="Dismiss">
        <XIcon />
      </button>
    </div>
  )
}
