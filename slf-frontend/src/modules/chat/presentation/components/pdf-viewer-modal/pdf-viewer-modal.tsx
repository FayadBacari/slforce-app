import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

interface PdfViewerModalProps {
  /** Local file:// URI to display. null = modal closed. */
  uri:     string | null;
  /** File name shown in the header. */
  name?:   string;
  onClose: () => void;
}

/**
 * Full-screen in-app PDF viewer for iOS.
 *
 * Uses react-native-webview backed by WKWebView which has native PDF rendering:
 *   • Horizontal page swipe
 *   • Pinch-to-zoom
 *   • Table of contents (long-press the pages icon)
 *
 * No share sheet — the user just reads the document and closes with ✕.
 *
 * Android uses the system Intent viewer (openFileWithAndroidIntent) instead,
 * so this component is only rendered on iOS.
 */
export function PdfViewerModal({ uri, name, onClose }: PdfViewerModalProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when a new document is opened
  const handleOpen = () => setHasError(false);

  return (
    <Modal
      visible={uri !== null}
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <StatusBar barStyle="dark-content" />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {name ?? 'Document'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── PDF content ─────────────────────────────────────────────── */}
        <View style={styles.contentArea}>
          {uri !== null && (
            <WebView
              source={{ uri }}
              style={styles.webView}
              // Required to load file:// URIs on iOS (WKWebView)
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              originWhitelist={['file://*', 'https://*', 'http://*']}
              // NOTE: onLoadEnd never fires for PDFs on iOS because WKWebView
              // hands rendering off to PDFKit (native engine). No loading
              // overlay — the PDF appears directly as soon as PDFKit is ready.
              onError={() => setHasError(true)}
            />
          )}

          {/* Error state */}
          {hasError && (
            <View style={styles.overlay}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>
                Impossible d'afficher ce document.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        Platform.OS === 'ios' ? 56 : 16,
    paddingBottom:     12,
    paddingHorizontal: 16,
    backgroundColor:   '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    flex:       1,
    fontSize:   16,
    fontWeight: '600',
    color:      '#1a1a1a',
    marginRight: 12,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius:    18,
    width:           36,
    height:          36,
    justifyContent:  'center',
    alignItems:      'center',
  },
  closeText: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#333',
  },
  contentArea: {
    flex:            1,
    backgroundColor: '#f5f5f5',
  },
  webView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent:  'center',
    alignItems:      'center',
    gap:             12,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorText: {
    fontSize:  14,
    color:     '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop:         8,
    paddingVertical:   10,
    paddingHorizontal: 24,
    backgroundColor:   '#007AFF',
    borderRadius:      8,
  },
  retryText: {
    color:      '#fff',
    fontWeight: '600',
    fontSize:   14,
  },
});
