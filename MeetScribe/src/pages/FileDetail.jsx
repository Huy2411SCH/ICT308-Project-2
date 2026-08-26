import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileTextIcon, ClockIcon, DownloadIcon, TrashIcon, VideoIcon, MicIcon, ArrowLeftIcon } from '../components/icons'
import { MOCK_FILES } from '../data/mockFiles'
import { filesService, normalizeDbFile } from '../lib/filesService'
import './FileDetail.css'

function fileIconFor(type) {
  if (type === 'video') return <VideoIcon />
  if (type === 'audio') return <MicIcon />
  return <FileTextIcon />
}

function isMockFile(file) {
  return typeof file.id === 'number'
}

export default function FileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const mockFile = MOCK_FILES.find((f) => String(f.id) === id)

  const [file, setFile] = useState(mockFile ?? null)
  const [loading, setLoading] = useState(!mockFile)
  const [mediaUrl, setMediaUrl] = useState(null)

  useEffect(() => {
    if (mockFile) return
    let cancelled = false

    filesService
      .getFile(id)
      .then((row) => {
        if (!cancelled) setFile(normalizeDbFile(row))
      })
      .catch((err) => {
        console.error('Failed to load file:', err)
        if (!cancelled) setFile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, mockFile])

  useEffect(() => {
    if (!file?.media_url) return
    let cancelled = false

    filesService
      .getFileUrl(file.media_url)
      .then((url) => {
        if (!cancelled) setMediaUrl(url)
      })
      .catch((err) => console.error('Failed to get file URL:', err))

    return () => {
      cancelled = true
    }
  }, [file?.media_url])

  const handleDelete = async () => {
    if (!file || isMockFile(file)) return
    if (!window.confirm(`Delete "${file.name}"? This can't be undone.`)) return
    try {
      await filesService.deleteFile(file)
      navigate('/files')
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  if (loading) {
    return (
      <div className="file-detail-page">
        <Link to="/files" className="back-link">
          <ArrowLeftIcon className="back-icon" /> Back to Files
        </Link>
        <div className="card">
          <div className="card-body">Loading</div>
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="file-detail-page">
        <Link to="/files" className="back-link">
          <ArrowLeftIcon className="back-icon" /> Back to Files
        </Link>
        <div className="card">
          <div className="card-body">File not found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="file-detail-page">
      <Link to="/files" className="back-link">
        <ArrowLeftIcon className="back-icon" /> Back to Files
      </Link>

      <div className="file-detail-header">
        <div className="file-icon file-icon-lg">{fileIconFor(file.type)}</div>
        <div>
          <h1 className="file-detail-name">{file.name}</h1>
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
        <div className="file-detail-actions">
          <button
            className="btn btn-outline btn-sm"
            disabled={!mediaUrl}
            onClick={() => mediaUrl && window.open(mediaUrl, '_blank', 'noopener')}
          >
            <DownloadIcon /> Download
          </button>
          <button className="btn btn-ghost btn-sm" disabled={isMockFile(file)} onClick={handleDelete}>
            <TrashIcon /> Delete
          </button>
        </div>
      </div>

      {file.status === 'processing' || !file.transcript ? (
        <div className="card">
          <div className="card-body processing-notice">
           
          </div>
        </div>
      ) : (
        <div className="file-detail-sections">
          <section className="card">
            <header className="card-header">
              <h2 className="card-title">Transcript</h2>
            </header>
            <div className="card-body transcript-body">
              {Array.isArray(file.transcript) ? (
                file.transcript.map((entry, index) => (
                  <div className="transcript-entry" key={index}>
                    {(entry.speaker || entry.time) && (
                      <div className="transcript-meta">
                        {entry.speaker && <span className="transcript-speaker">{entry.speaker}</span>}
                        {entry.time && <span className="transcript-time">{entry.time}</span>}
                      </div>
                    )}
                    <p>{entry.text}</p>
                  </div>
                ))
              ) : (
                <div className="transcript-entry">
                  <p>{file.transcript}</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <header className="card-header">
              <h2 className="card-title">Summary</h2>
            </header>
            <div className="card-body">
              {file.summary && typeof file.summary === 'object' ? (
                <>
                  <p className="summary-overview">{file.summary.overview}</p>

                  <h3 className="summary-subtitle">Key Points</h3>
                  <ul className="summary-list">
                    {file.summary.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>

                  {file.summary.actionItems?.length > 0 && (
                    <>
                      <h3 className="summary-subtitle">Action Items</h3>
                      <ul className="summary-list">
                        {file.summary.actionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p className="summary-overview">{file.summary || 'No summary available yet.'}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
