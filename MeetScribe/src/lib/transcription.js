import { supabase } from './supabaseClient'
import { apiHeaders } from './apiAuth'

const TRANSCRIBE_ENDPOINT = 'http://localhost:3001/transcribe'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // for download/playback links

export const TRANSCRIPTION_NOT_STARTED_MESSAGE =
  "Your file was saved, but transcription couldn't start. Open it from Your Files to retry."

// Uploads an audio/video file to Supabase Storage, creates its `files` row,
// and kicks off transcription on the backend. Returns the inserted row. 
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
    await startTranscription(fileRow.id)
  } catch (err) {
    console.error('Failed to start transcription:', err)
    return { ...fileRow, status: 'error' }
  }

  return fileRow
}

// Asks the backend to transcribe a file that's already in storage. If the
// backend can't be reached or refuses the job, nothing would ever move the
// row out of 'processing', so mark it 'error' (retryable) and throw.
async function startTranscription(fileId) {
  const res = await fetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ fileId }),
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
  await startTranscription(file.id)
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

// Removes the file's row and its media from Storage 
export async function deleteFile(file) {
  if (file.media_url) {
    const { error: storageError } = await supabase.storage.from('media').remove([file.media_url])
    if (storageError) throw storageError
  }
  const { error } = await supabase.from('files').delete().eq('id', file.id)
  if (error) throw error
}

// Calls `onChange` whenever any of the user's files rows change. Returns an unsubscribe function.
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
