// ─── readSearchParam ─────────────────────────────────────────────────────────
//
// Helper unique pour lire un param de route Expo Router.
//
// Pourquoi ce helper ? Expo Router type `useLocalSearchParams()` strictement
// par rapport au schéma de route détecté ; or les screens passent souvent
// des params custom (forward identity, query suggestion…) que le typage ne
// reconnaît pas. Sans ce helper, chaque caller faisait :
//
//   const raw = useLocalSearchParams() as Record<string, string | string[] | undefined>;
//   const id  = Array.isArray(raw.id) ? raw.id[0] : raw.id;
//
// Maintenant :
//
//   const params = useLocalSearchParams();
//   const id     = readSearchParam(params, 'id');
//
// Centralise l'unique cast et la coercion array→first-element en un seul endroit.

type RawSearchParams = Record<string, string | string[] | undefined>;

export function readSearchParam(
  rawParams: object,
  key:       string,
): string {
  // Le cast unique vit ici. Les callers manipulent ensuite des strings propres.
  const params = rawParams as RawSearchParams;
  const value  = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
