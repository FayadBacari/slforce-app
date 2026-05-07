// ─── Stream Chat file uploader (React Native) ────────────────────────────────
//
// The Stream Chat JS SDK internally calls `.split()` on the uri when a FormData
// or plain object is passed — it only works with browser File/Buffer.
// In React Native we bypass the SDK and call the REST API directly via native
// fetch, which natively supports { uri, name, type } inside FormData.

import { streamChatClient } from '@core/stream-chat/stream-chat-client';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY ?? '';

export interface FileToUpload {
  fileUri:   string;
  fileName:  string;
  mimeType:  string;
  isImage:   boolean;
  channelId: string;
}

// Uploads a file or image to Stream Chat's CDN and returns the public URL.
// Throws on HTTP error so the caller can mark the optimistic message as failed.
export async function uploadFileToStream(params: FileToUpload): Promise<string> {
  const { fileUri, fileName, mimeType, isImage, channelId } = params;

  // Retrieve the JWT from the Stream singleton without going through the store.
  const authToken = (streamChatClient as unknown as { tokenManager: { token: string } })
    .tokenManager?.token ?? '';

  const endpoint = isImage ? 'image' : 'file';
  const url =
    `${streamChatClient.baseURL}/channels/messaging/${channelId}/${endpoint}` +
    `?api_key=${STREAM_API_KEY}`;

  const form = new FormData();
  // React Native accepts { uri, name, type } as a FormData file entry.
  form.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);

  const response = await fetch(url, {
    method:  'POST',
    body:    form,
    headers: {
      Authorization:      authToken,
      'stream-auth-type': 'jwt',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stream upload failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { file: string };
  return json.file;
}
