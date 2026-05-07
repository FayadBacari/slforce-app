import React, { useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MIN_SCALE   = 1;
const MAX_SCALE   = 5;
const ZOOM_PRESET = 2.5; // scale applied on double-tap

interface PhotoViewerModalProps {
  /** The URI to display. Pass `null` to close the modal. */
  uri:     string | null;
  onClose: () => void;
}

/**
 * Full-screen photo viewer with:
 *   • Pinch-to-zoom (1× – 5×)
 *   • Pan when zoomed in
 *   • Double-tap to toggle between 1× and 2.5×
 *   • ✕ button and Android back-button to close
 *
 * GestureHandlerRootView is included here because React Native Modals
 * render in a separate view tree — they don't inherit the root provider
 * set up in app/_layout.tsx.
 */
export function PhotoViewerModal({ uri, onClose }: PhotoViewerModalProps) {
  // ── Shared animation values ──────────────────────────────────────────────
  const scale        = useSharedValue(1);
  const savedScale   = useSharedValue(1);
  const offsetX      = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const offsetY      = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  // Reset every time a new photo is shown (uri changes = new image opened)
  useEffect(() => {
    scale.value        = 1;
    savedScale.value   = 1;
    offsetX.value      = 0;
    savedOffsetX.value = 0;
    offsetY.value      = 0;
    savedOffsetY.value = 0;
    // Shared values are stable refs — omitting them from deps is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  // ── Gestures ─────────────────────────────────────────────────────────────

  /** Pinch to zoom between MIN_SCALE and MAX_SCALE */
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      // Snap back to 1× if the user pinched below minimum
      if (scale.value <= MIN_SCALE) {
        scale.value        = withTiming(MIN_SCALE);
        savedScale.value   = MIN_SCALE;
        offsetX.value      = withTiming(0);
        offsetY.value      = withTiming(0);
        savedOffsetX.value = 0;
        savedOffsetY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  /** Pan — only active when the image is zoomed in */
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= MIN_SCALE) return;
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    })
    .onEnd(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    });

  /** Double-tap: zoom to 2.5× or reset to 1× */
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(300)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value        = withTiming(MIN_SCALE);
        savedScale.value   = MIN_SCALE;
        offsetX.value      = withTiming(0);
        offsetY.value      = withTiming(0);
        savedOffsetX.value = 0;
        savedOffsetY.value = 0;
      } else {
        scale.value      = withTiming(ZOOM_PRESET);
        savedScale.value = ZOOM_PRESET;
      }
    });

  // doubleTap has priority over pinch+pan (Race: first to activate wins)
  const composed = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={uri !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Required: Modal renders in its own view tree, outside the app's GHRV */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={styles.backdrop}>

          {/* ── Close button ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={16}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* ── Zoomable image ────────────────────────────────────────────── */}
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
              {uri !== null && (
                <Image
                  source={{ uri }}
                  style={styles.image}
                  contentFit="contain"
                  transition={0}
                />
              )}
            </Animated.View>
          </GestureDetector>

          {/* ── Hint ─────────────────────────────────────────────────────── */}
          <Text style={styles.hint}>Double-tap pour zoomer · Pince pour agrandir</Text>

        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  closeButton: {
    position:        'absolute',
    top:             Platform.OS === 'ios' ? 58 : 24,
    right:           16,
    zIndex:          10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius:    20,
    width:           38,
    height:          38,
    justifyContent:  'center',
    alignItems:      'center',
  },
  closeText: {
    color:      'white',
    fontSize:   16,
    fontWeight: '700',
  },
  imageWrapper: {
    width:          SCREEN_W,
    height:         SCREEN_H * 0.85,
    justifyContent: 'center',
    alignItems:     'center',
  },
  image: {
    width:  SCREEN_W,
    height: SCREEN_H * 0.85,
  },
  hint: {
    position:  'absolute',
    bottom:    Platform.OS === 'ios' ? 44 : 24,
    color:     'rgba(255, 255, 255, 0.45)',
    fontSize:  12,
    textAlign: 'center',
  },
});
