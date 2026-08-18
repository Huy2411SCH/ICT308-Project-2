import { useEffect, useRef, useState } from 'react'
import {
  MicIcon,
  VideoIcon,
  StopIcon,
  UploadCloudIcon,
  FileTextIcon,
  ClockIcon,
  DownloadIcon,
  TrashIcon,
} from '../components/icons'
import { authService } from '../lib/authService'
import './Dashboard.css'

// Placeholder file rows
const MOCK_FILES = [
  { id: 1, name: 'Q4 Strategy Meeting.mp4', duration: '45:32', date: 'May 18, 2026', status: 'ready' },
  { id: 2, name: 'Client Onboarding Call.mp3', duration: '22:10', date: 'May 12, 2026', status: 'processing' },
  { id: 3, name: 'Sprint Retro Notes.txt', duration: null, date: 'May 5, 2026', status: 'ready' },
]

function formatElapsed(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function Dashboard({ user }) {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Welcome back, {user?.user_metadata?.name || user?.email || 'there'}</h1>

      <div className="dashboard-sections">
        <RecordMeetingCard />
        <UploadFilesCard />
        <FilesList files={MOCK_FILES} />
      </div>
    </div>
  )
}

// Record meeting UI
function RecordMeetingCard() {
  const [recordingMode, setRecordingMode] = useState(null) // null | 'audio' | 'video'
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!recordingMode) return
    const intervalId = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(intervalId)
  }, [recordingMode])

  const startRecording = (mode) => {
    // TODO: request mic/camera permission and start a MediaRecorder here.
    setElapsedSeconds(0)
    setRecordingMode(mode)
  }

  const stopRecording = () => {
    // TODO: stop the MediaRecorder and hand the resulting blob off for upload.
    setRecordingMode(null)
  }

  return (
    <section className="card">
      <header className="card-header">
        <h2 className="card-title">Record Meeting</h2>
        <p className="card-subtitle">Record a meeting directly in your browser using your microphone or camera</p>
      </header>

      <div className="card-body">
        {recordingMode ? (
          <div className="recording-live">
            <div className="recording-indicator">
              <span className="pulse-dot" />
              Recording {recordingMode}&hellip;
            </div>
            <div className="recording-timer">{formatElapsed(elapsedSeconds)}</div>
            <button className="btn btn-danger btn-lg" onClick={stopRecording}>
              <StopIcon /> Stop Recording
            </button>
          </div>
        ) : (
          <div className="recording-idle">
            <button className="btn btn-primary btn-lg" onClick={() => startRecording('audio')}>
              <MicIcon /> Record Audio
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => startRecording('video')}>
              <VideoIcon /> Record Video
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// Upload files UI
function UploadFilesCard() {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [consentGiven, setConsentGiven] = useState(false)

  const openFilePicker = () => fileInputRef.current?.click()

  const handleFilesSelected = (fileList) => {
    const file = fileList?.[0]
    if (file) setPendingFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    handleFilesSelected(event.dataTransfer.files)
  }

  const cancelUpload = () => {
    setPendingFile(null)
    setConsentGiven(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFile = () => {
    // TODO: send file to backend
    cancelUpload()
  }

  return (
    <section className="card">
      <header className="card-header">
        <h2 className="card-title">Upload Files</h2>
        <p className="card-subtitle">Upload a recording to transcribe, or an existing transcript file</p>
      </header>

      <div className="card-body">
        <div
          className={`drop-zone${isDragOver ? ' drop-zone-active' : ''}`}
          onClick={openFilePicker}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <UploadCloudIcon className="drop-zone-icon" />
          <h3>Drag and drop your files here</h3>
          <p>Audio/Video: MP3, MP4, WAV, M4A &middot; Transcripts: TXT, DOCX, PDF, SRT, VTT</p>
          <button
            className="btn btn-primary"
            onClick={(event) => {
              event.stopPropagation() // don't let the drop-zone's own onClick fire twice
              openFilePicker()
            }}
          >
            Browse Files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="visually-hidden"
          accept="audio/*,video/*,.txt,.docx,.pdf,.srt,.vtt"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />

        {pendingFile && (
          <div className="consent-panel">
            <p className="consent-warning">
              <strong>Consent required.</strong> Confirm all participants have consented to recording and
              AI-based processing before <em>{pendingFile.name}</em> is processed.
            </p>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(event) => setConsentGiven(event.target.checked)}
              />
              I confirm all participants have given consent.
            </label>
            <div className="consent-actions">
              <button className="btn btn-primary" disabled={!consentGiven} onClick={processFile}>
                Process File
              </button>
              <button className="btn btn-ghost" onClick={cancelUpload}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// Files list UI
function FilesList({ files }) {
  const [activeTab, setActiveTab] = useState('video')

  const filtered = files.filter((file) => file.type === activeTab)

  return (
    <section>
      <h2 className="section-title">Your Files</h2>
      <div className="file-tabs">
        <button
          className={`file-tab${activeTab === 'video' ? ' file-tab-active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          Videos
        </button>
        <button
          className={`file-tab${activeTab === 'audio' ? ' file-tab-active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
        <button
          className={`file-tab${activeTab === 'transcript' ? ' file-tab-active' : ''}`}
          onClick={() => setActiveTab('transcript')}
        >
          Transcripts
        </button>
      </div>


      {/* render `filtered` instead of `files` below */}
    </section>
  )
}