import * as FileSystem    from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

// ─── MIME → Android ACTION_VIEW type ──────────────────────────────────────────
const MIME_TYPES: Record<string, string> = {
  'application/pdf':    'application/pdf',
  'image/jpeg':         'image/jpeg',
  'image/png':          'image/png',
  'image/gif':          'image/gif',
  'image/webp':         'image/webp',
  'video/mp4':          'video/mp4',
  'video/quicktime':    'video/quicktime',
  'application/msword': 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel': 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Downloads a Stream Chat attachment URL into the device cache.
 * Returns the local `file://` URI so the caller can decide how to display it.
 *
 * Throws if the HTTP download fails.
 */
export async function downloadAttachment(
  url:      string,
  fileName: string,
): Promise<string> {
  if (!FileSystem.cacheDirectory) {
    throw new Error("Le répertoire cache n'est pas disponible sur cet appareil.");
  }

  const safeName  = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const localUri  = `${FileSystem.cacheDirectory}${safeName}`;

  const { status } = await FileSystem.downloadAsync(url, localUri);
  if (status !== 200) {
    throw new Error(`Impossible de télécharger le fichier (code HTTP ${status}).`);
  }

  return localUri; // file:///...
}

/**
 * Opens a locally cached file via Android's ACTION_VIEW Intent.
 * Android only — iOS uses the in-app WebView modal instead.
 *
 * Converts the file:// URI to a content:// URI (required since Android 7+)
 * then fires an Intent with the correct MIME type so the OS picks the right
 * native viewer (Adobe, Google PDF Viewer, etc.) without any share sheet.
 */
export async function openFileWithAndroidIntent(
  localUri: string,
  mimeType: string = 'application/octet-stream',
): Promise<void> {
  const contentUri = await FileSystem.getContentUriAsync(localUri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data:  contentUri,
    type:  MIME_TYPES[mimeType] ?? 'application/octet-stream',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });
}
