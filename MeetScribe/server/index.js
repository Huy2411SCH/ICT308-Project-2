require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { AssemblyAI } = require('assemblyai')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

app.get('/health', (_req, res) => res.json({ ok: true }))

function formatDuration(totalSeconds) {
  if (!totalSeconds) return null
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(Math.round(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

// With speaker_labels on, AssemblyAI splits the audio into per-speaker turns
// (utterances) instead of one flat block of text. Fall back to the plain
// text if diarization found nothing (e.g. very short clips).
function formatTranscript(transcript) {
  if (transcript.utterances && transcript.utterances.length > 0) {
    return transcript.utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join('\n\n')
  }
  return transcript.text
}

// Kicks off transcription for a file already uploaded to Supabase Storage.
// Responds immediately; the file's `status`/`transcript` columns are updated
// once AssemblyAI finishes.
app.post('/transcribe', async (req, res) => {
  const { fileId, mediaUrl } = req.body || {}
  if (!fileId || !mediaUrl) {
    return res.status(400).json({ error: 'fileId and mediaUrl are required' })
  }

  res.status(202).json({ status: 'processing' })

  try {
    // Fetch the bytes ourselves and hand AssemblyAI a buffer rather than the
    // mediaUrl directly — mediaUrl may point at a local Supabase instance
    // (127.0.0.1) that AssemblyAI's servers can't reach, but this backend can.
    const mediaRes = await fetch(mediaUrl)
    if (!mediaRes.ok) throw new Error(`Failed to fetch media (${mediaRes.status})`)
    const buffer = Buffer.from(await mediaRes.arrayBuffer())

    const transcript = await assembly.transcripts.transcribe({ audio: buffer, speaker_labels: true })

    if (transcript.status === 'error') {
      console.error(`Transcription ${fileId} failed:`, transcript.error)
      return
    }

    const duration = formatDuration(transcript.audio_duration)

    const { error } = await supabase
      .from('files')
      .update({ transcript: formatTranscript(transcript), status: 'ready', duration })
      .eq('id', fileId)

    if (error) console.error(`Failed to save transcript for ${fileId}:`, error)
  } catch (err) {
    console.error(`Transcription ${fileId} threw:`, err)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Transcription server listening on port ${PORT}`))