// ─── ESLint flat config ──────────────────────────────────────────────────────
//
// Étend la base Expo et ajoute les règles d'architecture du projet :
//
//   1. Interdit l'import direct de `@core/api/api-client` hors des data-sources.
//      Garantit que tout appel HTTP passe par la couche `data/data-sources/`
//      qui transforme la réponse serveur en entité de domaine.
//
//   2. Interdit `useRouter()` directement — préférer le helper typé
//      `pushRoute() / replaceRoute()` de `@shared/navigation/app-routes`.
//      (override possible dans les hooks bas-niveau si vraiment nécessaire).

const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,

  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name:    '@core/api/api-client',
              message:
                'Le client Axios ne doit être consommé que par les data-sources. ' +
                'Crée ou utilise une fonction `callXxxApiEndpoint` dans ' +
                '`@modules/<feature>/data/data-sources/` à la place.',
            },
          ],
          patterns: [
            // Empêche aussi le chemin relatif équivalent.
            {
              group:   ['**/api-client', '**/api-client.ts'],
              message: 'Voir la règle ci-dessus — passer par une data-source.',
            },
          ],
        },
      ],
    },
  },

  // Exception : les data-sources EUX-MÊMES doivent pouvoir importer apiClient.
  {
    files: ['src/modules/*/data/data-sources/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Exception : api-client + ses utilitaires immédiats (api-error-handler,
  // api-response-envelope) sont la couche infrastructurelle — leurs propres
  // imports relatifs ne déclenchent pas la règle.
  {
    files: ['src/core/api/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Ignore l'output de build, le cache Expo et les modules nodes.
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'ios/',
      'android/',
      'dist/',
      '**/*.d.ts',
    ],
  },
];
