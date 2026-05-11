import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@shared/design-system';
import { createLogger } from '@shared/logger/logger';

// ─── AppErrorBoundary ────────────────────────────────────────────────────────
//
// Boundary global d'erreurs React. Sans ce composant, une exception jetée
// pendant le render d'un screen crashe TOUTE l'app (l'utilisateur voit
// l'écran rouge / un crash plein écran).
//
// Avec ce boundary monté autour des routes (`app/_layout.tsx`), une erreur
// est capturée, loggée, et l'utilisateur voit un fallback avec un bouton
// "Réessayer" qui re-monte le sous-arbre.
//
// Important : les ErrorBoundaries en React ne capturent PAS :
//   • Les erreurs dans les event handlers (à wrapper dans un try/catch)
//   • Les erreurs async (Promises non await — utiliser `.catch()`)
//   • Les erreurs du SSR (non applicable ici, RN client only)
//
// Class component obligatoire — l'API d'error boundaries n'a pas d'équivalent hooks.

const logger = createLogger('ErrorBoundary');

interface AppErrorBoundaryProps {
  children: ReactNode;
  // Fallback custom optionnel — si non fourni, on utilise notre UI par défaut.
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface AppErrorBoundaryState {
  caughtError: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { caughtError: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    // Mise à jour du state pour rendre le fallback au prochain render.
    return { caughtError: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Logging — plus tard reporting Sentry via le logger central.
    logger.error('Uncaught exception in component tree', error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ caughtError: null });
  };

  render(): ReactNode {
    const { caughtError } = this.state;
    const { children, fallback } = this.props;

    if (!caughtError) return children;

    if (fallback) return fallback(caughtError, this.resetErrorBoundary);

    return <DefaultErrorFallback error={caughtError} onRetry={this.resetErrorBoundary} />;
  }
}

// ─── DefaultErrorFallback ────────────────────────────────────────────────────
//
// UI fallback minimaliste — volontairement neutre (pas de theme provider, pas
// de i18n) pour éviter un crash en cascade si c'est ces providers qui ont
// jeté l'exception en premier lieu.

interface DefaultErrorFallbackProps {
  error:    Error;
  onRetry:  () => void;
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps): React.JSX.Element {
  return (
    <View style={fallbackStyles.container}>
      <Text style={fallbackStyles.emoji}>⚠️</Text>
      <Text style={fallbackStyles.title}>Une erreur inattendue est survenue</Text>
      <Text style={fallbackStyles.message}>
        L&apos;application a rencontré un problème. Tu peux réessayer ou redémarrer l&apos;app.
      </Text>
      {typeof __DEV__ !== 'undefined' && __DEV__ && (
        <Text style={fallbackStyles.devError}>{error.message}</Text>
      )}
      <TouchableOpacity
        style={fallbackStyles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
      >
        <Text style={fallbackStyles.retryLabel}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SPACING[8],   // 32 px
    backgroundColor:   COLORS.neutral.gray50,
  },
  emoji: {
    fontSize:     48,
    marginBottom: SPACING[4],        // 16 px
  },
  title: {
    fontSize:     TYPOGRAPHY.fontSize.lg,
    fontWeight:   TYPOGRAPHY.fontWeight.bold,
    color:        COLORS.neutral.gray900,
    textAlign:    'center',
    marginBottom: SPACING[2],        // 8 px
  },
  message: {
    fontSize:     TYPOGRAPHY.fontSize.md,
    color:        COLORS.neutral.gray600,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: SPACING[6],        // 24 px
  },
  devError: {
    fontSize:          TYPOGRAPHY.fontSize.sm,
    color:             COLORS.semantic.danger,
    textAlign:         'center',
    marginBottom:      SPACING[6],
    paddingHorizontal: SPACING[4],
    paddingVertical:   SPACING[2],
    backgroundColor:   COLORS.semantic.dangerLight,
    borderRadius:      BORDER_RADIUS.md,
  },
  retryButton: {
    backgroundColor:   COLORS.brand.primary,
    paddingHorizontal: SPACING[8],
    paddingVertical:   SPACING[4],
    borderRadius:      BORDER_RADIUS.lg,
  },
  retryLabel: {
    color:      COLORS.neutral.white,
    fontSize:   TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
