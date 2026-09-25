// Records the user's microphone AND the audio of a shared tab/screen

const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const VIDEO_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4',
]
// Returns the first MIME type that is supported by the browser, or an empty string if none are supported
function pickMimeType(candidates) {
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}
// Returns a MediaRecorder that records the user's microphone AND the audio of a shared tab/screen
export function isSystemAudioCaptureSupported() {
  return Boolean(navigator.mediaDevices?.getDisplayMedia)
    && typeof MediaRecorder !== 'undefined'
}

// mode: 'audio' | 'video'
// onAutoStop: called if the user clicks the browser's "Stop sharing" button.
export async function startMeetingRecording({ mode = 'audio', onAutoStop } = {}) {
  // 1. Ask the user to pick the meeting tab / window / screen to capture.
  //    Chrome requires a video track to be requested even for audio-only.
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      suppressLocalAudioPlayback: false, // keep hearing the meeting yourself
    },
    systemAudio: 'include',            // offer "Share system audio" (Chrome/Edge)
    selfBrowserSurface: 'exclude',     // hide the MeetScribe tab from the picker
    surfaceSwitching: 'include',
  })

  // 2. Ask for the microphone. Echo cancellation stops the mic from re-recording
  //    the meeting audio coming out of the speakers.
  let micStream
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
  } catch (err) {
    displayStream.getTracks().forEach((t) => t.stop())
    throw err
  }

  const hasSystemAudio = displayStream.getAudioTracks().length > 0

  // 3. Mix both sources into one audio track.
  const audioContext = new AudioContext()
  // The context may start suspended because the permission prompts above
  // consumed the click's user activation.
  if (audioContext.state === 'suspended') await audioContext.resume()
  const destination = audioContext.createMediaStreamDestination()

  const micGain = audioContext.createGain()
  micGain.gain.value = 1.0
  audioContext.createMediaStreamSource(micStream).connect(micGain).connect(destination)

  if (hasSystemAudio) {
    const systemGain = audioContext.createGain()
    systemGain.gain.value = 1.0
    audioContext.createMediaStreamSource(displayStream)
      .connect(systemGain).connect(destination)
  }

  // 4. Build the stream that actually gets recorded.
  const mixedAudioTrack = destination.stream.getAudioTracks()[0]
  const recordedStream = mode === 'video'
    ? new MediaStream([displayStream.getVideoTracks()[0], mixedAudioTrack])
    : new MediaStream([mixedAudioTrack])

  // In audio mode we don't need the screen video - stop it to save CPU.
  // (Stopping the video track does NOT stop the display audio track.)
  if (mode === 'audio') displayStream.getVideoTracks().forEach((t) => t.stop())

  const mimeType = pickMimeType(
    mode === 'video' ? VIDEO_MIME_CANDIDATES : AUDIO_MIME_CANDIDATES)
  const recorderOptions = {}
  if (mimeType) recorderOptions.mimeType = mimeType
  if (mode === 'video') recorderOptions.videoBitsPerSecond = 1_500_000
  const recorder = new MediaRecorder(recordedStream, recorderOptions)
  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    displayStream.getTracks().forEach((t) => t.stop())
    micStream.getTracks().forEach((t) => t.stop())
    audioContext.close()
  }

  // If the user presses the browser's own "Stop sharing" bar, finish cleanly.
  const shareTrack = displayStream.getAudioTracks()[0]
    || displayStream.getVideoTracks()[0]
  shareTrack?.addEventListener('ended', () => {
    if (recorder.state !== 'inactive') onAutoStop?.()
  })

  recorder.start(1000) // emit a chunk every second so a crash loses little data

  // stop() resolves with a File ready for uploadMediaForTranscription().
  const stop = () => new Promise((resolve) => {
    recorder.onstop = () => {
      cleanup()
      // Strip the ";codecs=..." part so it matches the bucket's audio/* video/* rule.
      const baseType = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0]
      const ext = baseType.includes('mp4') ? 'mp4' : 'webm'
      // Local time, e.g. "2026-09-25 22-30" (toISOString would give UTC).
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}-${pad(now.getMinutes())}`
      const blob = new Blob(chunks, { type: baseType })
      resolve(new File([blob], `Meeting ${stamp}.${ext}`, { type: baseType }))
    }
    if (recorder.state !== 'inactive') recorder.stop()
    else recorder.onstop()
  })

  const cancel = () => {
    recorder.onstop = null
    if (recorder.state !== 'inactive') recorder.stop()
    cleanup()
  }

  return { stop, cancel, hasSystemAudio }
}
