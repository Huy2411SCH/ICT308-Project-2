import { useEffect, useState } from 'react'
import { FileTextIcon } from './icons'
import './FilePreview.css'

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Browser-recorded WebM files have no duration in their header, so the player
// reports Infinity and the seek bar doesn't work. Seeking past the end forces
// the browser to scan the file and work out the real duration.
function fixUnknownDuration(event) {
  const media = event.currentTarget
  if (media.duration !== Infinity) return
  media.addEventListener('timeupdate', () => { media.currentTime = 0 }, { once: true })
  media.currentTime = Number.MAX_SAFE_INTEGER
}

// Shows a live video/audio preview of a not-yet-uploaded file. When
// `onChangeFile` is given, also shows a button to pick a different one.
export default function FilePreview({ file, onChangeFile }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const isVideo = file.type.startsWith('video')
  const isAudio = file.type.startsWith('audio')

  return (
    <div className="file-preview">
      {isVideo && previewUrl && (
        <video src={previewUrl} controls className="file-preview-media" onLoadedMetadata={fixUnknownDuration} />
      )}
      {isAudio && previewUrl && (
        <audio src={previewUrl} controls className="file-preview-audio" onLoadedMetadata={fixUnknownDuration} />
      )}
      {!isVideo && !isAudio && (
        <div className="file-preview-generic">
          <FileTextIcon />
        </div>
      )}

      <div className="file-preview-footer">
        <div className="file-preview-info">
          <span className="file-preview-name">{file.name}</span>
          <span className="file-preview-size">{formatFileSize(file.size)}</span>
        </div>
        {onChangeFile && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onChangeFile}>
            Choose a different file
          </button>
        )}
      </div>
    </div>
  )
}
