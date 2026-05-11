// ─── Logger central ──────────────────────────────────────────────────────────
//
// Wrapper minimaliste autour de `console.*` qui ajoute :
//   • Un namespace pour mieux filtrer en debug (ex: "[ChatScreen] failed…")
//   • Une bascule automatique en dev/prod : verbose en dev, silencieux en prod
//   • Un point unique pour brancher Sentry / Datadog / etc. plus tard sans
//     toucher aux centaines de call-sites.
//
// Usage :
//   import { createLogger } from '@shared/logger/logger';
//   const logger = createLogger('ChatScreen');
//   logger.debug('connection state', { ... });
//   logger.warn('non-fatal', error);
//   logger.error('fatal', error);
//
// Convention :
//   • debug  — verbose, bruit acceptable (réseau, lifecycle hooks)
//   • info   — événement notable (login OK, paiement enregistré)
//   • warn   — récupérable mais à surveiller (sync chat raté, retry réussi)
//   • error  — anomalie (à reporter Sentry quand branché)

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppLogger {
  debug: (message: string, ...details: unknown[]) => void;
  info:  (message: string, ...details: unknown[]) => void;
  warn:  (message: string, ...details: unknown[]) => void;
  error: (message: string, ...details: unknown[]) => void;
}

// __DEV__ est injecté par Metro (react-native). En prod (release builds), false.
// On garde info/warn/error en prod ; seul debug est mis en silence pour limiter
// le bruit dans les outils de monitoring.
const IS_DEVELOPMENT_BUILD = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

function shouldLogAtLevel(level: LogLevel): boolean {
  if (IS_DEVELOPMENT_BUILD) return true;
  return level !== 'debug';
}

// Format compact : `[Namespace] message` — facile à grepper dans les logs.
function formatPrefix(namespace: string): string {
  return `[${namespace}]`;
}

export function createLogger(namespace: string): AppLogger {
  const prefix = formatPrefix(namespace);

  return {
    debug(message, ...details) {
      if (!shouldLogAtLevel('debug')) return;
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}`, ...details);
    },
    info(message, ...details) {
      if (!shouldLogAtLevel('info')) return;
      // eslint-disable-next-line no-console
      console.info(`${prefix} ${message}`, ...details);
    },
    warn(message, ...details) {
      if (!shouldLogAtLevel('warn')) return;
      // eslint-disable-next-line no-console
      console.warn(`${prefix} ${message}`, ...details);
    },
    error(message, ...details) {
      if (!shouldLogAtLevel('error')) return;
      // eslint-disable-next-line no-console
      console.error(`${prefix} ${message}`, ...details);
      // TODO: brancher Sentry/Datadog ici quand l'observabilité prod sera en place.
      // Sentry.captureException(details[0] instanceof Error ? details[0] : new Error(message));
    },
  };
}
