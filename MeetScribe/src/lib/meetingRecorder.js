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

export async function startMeetingRecording({ mode = 'audio', onAutoStop } = {}) {

}