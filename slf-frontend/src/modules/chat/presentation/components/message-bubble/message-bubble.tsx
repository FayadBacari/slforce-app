import React, { memo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@shared/theme/theme-provider';
import { formatTimeFromDate } from '@shared/utils/format-date.util';
import type { MessageEntity } from '../../../domain/entities/message.entity';
import {
  downloadAttachment,
  openFileWithAndroidIntent,
} from '../../../data/utils/open-file-attachment.util';
import { PhotoViewerModal } from '../photo-viewer-modal/photo-viewer-modal';
import { PdfViewerModal }   from '../pdf-viewer-modal/pdf-viewer-modal';
import { buildMessageBubbleStyles } from './styles/message-bubble.styles';

interface MessageBubbleProps {
  message:     MessageEntity;
  isMyMessage: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isMyMessage,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const styles = buildMessageBubbleStyles(theme, isMyMessage, message.status);
  const formattedTime = formatTimeFromDate(message.sentAt);

  // ── Photo viewer (fullscreen zoom) ───────────────────────────────────────
  const [viewerPhotoUri, setViewerPhotoUri] = useState<string | null>(null);

  // ── PDF viewer (iOS: in-app WebView — Android: native Intent) ────────────
  const [pdfViewerUri,  setPdfViewerUri]  = useState<string | null>(null);
  const [pdfViewerName, setPdfViewerName] = useState<string>('Document');

  // ── Download state ───────────────────────────────────────────────────────
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  /**
   * Handles a tap or long-press on any file attachment.
   *
   * Flow:
   *   1. Download from Stream CDN → local cache (file://)
   *   2. iOS  → open PdfViewerModal (inline WebView, no share sheet)
   *   3. Android → fire ACTION_VIEW Intent (opens native PDF / file viewer)
   */
  async function handleFileOpen(
    id:       string,
    url:      string,
    name:     string,
    mimeType: string | undefined,
  ): Promise<void> {
    if (downloadingId !== null) return;

    setDownloadingId(id);
    try {
      const localUri = await downloadAttachment(url, name);

      if (Platform.OS === 'ios') {
        // iOS: show the document inline — no share sheet, no app switch
        setPdfViewerName(name);
        setPdfViewerUri(localUri);
      } else {
        // Android: open with the native viewer app via Intent
        await openFileWithAndroidIntent(localUri, mimeType);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue.';
      Alert.alert("Impossible d'ouvrir le fichier", msg);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubbleContainer}>

        {/* ── Attachments ─────────────────────────────────────────────── */}
        {message.attachments.map((att) =>
          att.type === 'image' ? (

            // Photo → tap opens fullscreen zoom viewer
            <TouchableOpacity
              key={att.id}
              activeOpacity={0.85}
              onPress={() => setViewerPhotoUri(att.url)}
            >
              <Image
                source={{ uri: att.url }}
                style={styles.attachmentImage}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>

          ) : (

            // File (PDF, Word, …) → tap OR long-press opens the viewer
            <TouchableOpacity
              key={att.id}
              style={styles.fileAttachmentRow}
              activeOpacity={0.7}
              disabled={downloadingId !== null}
              onPress={() =>
                void handleFileOpen(att.id, att.url, att.name ?? 'document', att.mimeType)
              }
              onLongPress={() =>
                void handleFileOpen(att.id, att.url, att.name ?? 'document', att.mimeType)
              }
              delayLongPress={400}
            >
              {downloadingId === att.id ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={styles.fileIcon}
                />
              ) : (
                <Text style={styles.fileIcon}>📄</Text>
              )}
              <Text style={styles.fileNameText} numberOfLines={2}>
                {att.name ?? 'Document'}
              </Text>
            </TouchableOpacity>

          ),
        )}

        {/* ── Text ─────────────────────────────────────────────────────── */}
        {message.text ? (
          <Text style={styles.messageText}>{message.text}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formattedTime}</Text>
          {isMyMessage && (
            <Text style={styles.statusIndicator}>
              {message.status === 'sending' ? '⏳' : message.status === 'failed' ? '❌' : '✓'}
            </Text>
          )}
        </View>
      </View>

      {/* ── Fullscreen photo viewer ──────────────────────────────────── */}
      <PhotoViewerModal
        uri={viewerPhotoUri}
        onClose={() => setViewerPhotoUri(null)}
      />

      {/* ── In-app PDF / document viewer (iOS) ──────────────────────── */}
      <PdfViewerModal
        uri={pdfViewerUri}
        name={pdfViewerName}
        onClose={() => setPdfViewerUri(null)}
      />
    </View>
  );
},
(previousProps, nextProps) => {
  return (
    previousProps.message.id                 === nextProps.message.id          &&
    previousProps.message.status             === nextProps.message.status      &&
    previousProps.message.text               === nextProps.message.text        &&
    previousProps.message.attachments.length === nextProps.message.attachments.length
  );
});
