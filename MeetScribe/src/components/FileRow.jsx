import { useNavigate } from 'react-router-dom'
import { FileTextIcon, ClockIcon, DownloadIcon, TrashIcon, VideoIcon, MicIcon } from './icons'
import { filesService } from '../lib/filesService'

function fileIconFor(type) {
  if (type === 'video') return <VideoIcon />
  if (type === 'audio') return <MicIcon />
  return <FileTextIcon />
}

// Mock/demo rows use numeric ids; real Supabase rows use uuid strings.
function isMockFile(file) {
  return typeof file.id === 'number'
}

export default function FileRow({ file, onDeleted }) {
  const navigate = useNavigate()

  const handleDownload = async (event) => {
    event.stopPropagation()
    if (!file.media_url) return
    try {
      const url = await filesService.getFileUrl(file.media_url)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      console.error('Failed to get file URL:', err)
    }
  }

  const handleDelete = async (event) => {
    event.stopPropagation()
    if (isMockFile(file)) return
    if (!window.confirm(`Delete "${file.name}"? This can't be undone.`)) return
    try {
      await filesService.deleteFile(file)
      onDeleted?.()
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  return (
    <div className="file-row file-row-clickable" onClick={() => navigate(`/files/${file.id}`)}>
      <div className="file-icon">{fileIconFor(file.type)}</div>

      <div className="file-meta">
        <div className="file-name">{file.name}</div>
        <div className="file-details">
          {file.duration && (
            <span>
              <ClockIcon /> {file.duration}
            </span>
          )}
          <span>{file.date}</span>
          {file.size && <span>{file.size}</span>}
          <span className={`badge badge-${file.status}`}>{file.status}</span>
        </div>
      </div>

      <div className="file-actions">
        <button className="btn btn-outline btn-sm" onClick={handleDownload} disabled={!file.media_url}>
          <DownloadIcon /> Download
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleDelete} disabled={isMockFile(file)}>
          <TrashIcon /> Delete
        </button>
      </div>
    </div>
  )
}
