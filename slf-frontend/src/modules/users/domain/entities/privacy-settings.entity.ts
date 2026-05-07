// Privacy preferences stored per user in MongoDB and synced to Stream Chat.
export interface PrivacySettingsEntity {
  isProfilePublic:  boolean;   // false → profile hidden from search results
  showOnlineStatus: boolean;   // false → chat partner sees "Désactivé" instead of presence
}
