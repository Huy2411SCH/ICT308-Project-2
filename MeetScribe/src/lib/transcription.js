import { supabase } from './supabaseClient'

const TRANSCRIBE_ENDPOINT = 'http://localhost:3001/transcribe'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // long enough for AssemblyAI to fetch the file

export const TRANSCRIPTION_NOT_STARTED_MESSAGE =
  "Your file was saved, but transcription couldn't start. Open it from Your Files to retry."

// Uploads an audio/video file to Supabase Storage, creates its `files` row,
// and kicks off transcription on the backend. Returns the inserted row. If
// transcription couldn't be started, the file is still kept and the returned
// row has status 'error', so the user can retry from the file page.
export async function uploadMediaForTranscription(user, file) {
  const path = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
  if (uploadError) throw uploadError

  // Store the storage path, not the signed URL — the signed URL expires in an
  // hour, but the path is stable and a fresh signed URL can be minted for it
  // whenever it's actually needed (download, playback).
  const { data: fileRow, error: insertError } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      name: file.name,
      type: file.type.startsWith('video') ? 'video' : 'audio',
      status: 'processing',
      media_url: path,
    })
    .select()
    .single()
  if (insertError) throw insertError

  try {
    await startTranscription(fileRow.id, path)
  } catch (err) {
    console.error('Failed to start transcription:', err)
    return { ...fileRow, status: 'error' }
  }

  return fileRow
}

// Asks the backend to transcribe a file that's already in storage. If the
// backend can't be reached or refuses the job, nothing would ever move the
// row out of 'processing', so mark it 'error' (retryable) and throw.
async function startTranscription(fileId, mediaPath) {
  const { data: signed, error: signError } = await supabase.storage
    .from('media')
    .createSignedUrl(mediaPath, SIGNED_URL_TTL_SECONDS)
  if (signError) throw signError

  const res = await fetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, mediaUrl: signed.signedUrl }),
  }).catch(() => null)

  if (!res?.ok) {
    await supabase.from('files').update({ status: 'error' }).eq('id', fileId)
    throw new Error('Could not reach the transcription server.')
  }
}

// Re-runs transcription for a file whose previous attempt failed or got
// stuck. Resolves to the new attempt's start time.
export async function retryTranscription(file) {
  const processingStartedAt = new Date().toISOString()
  const { error } = await supabase
    .from('files')
    .update({ status: 'processing', processing_started_at: processingStartedAt })
    .eq('id', file.id)
  if (error) throw error
  await startTranscription(file.id, file.media_url)
  return processingStartedAt
}

// `files.media_url` holds a storage path, not a fetchable URL — mint a fresh
// signed URL on demand for downloads/playback.
export async function getMediaDownloadUrl(path) {
  const { data, error } = await supabase.storage.from('media').createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

export async function fetchFiles() {
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteFile(fileId) {
  const { error } = await supabase.from('files').delete().eq('id', fileId)
  if (error) throw error
}

// Calls `onChange` whenever any of the user's files rows change (e.g. status
// flips from 'processing' to 'ready'). Returns an unsubscribe function.
export function subscribeToFiles(userId, onChange) {
  const channel = supabase
    .channel('files-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'files', filter: `user_id=eq.${userId}` },
      onChange
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
