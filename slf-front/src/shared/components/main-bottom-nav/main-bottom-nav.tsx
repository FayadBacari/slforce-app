import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { useAuthenticationStore } from '@stores/authentication-store';
import { APP_IMAGES } from '@shared/assets/app-images';
import { useUnreadMessageCount } from '@modules/chat/presentation/hooks/use-unread-count.hook';
import { buildMainBottomNavStyles } from './main-bottom-nav.styles';

// The 4 main tabs of the app, in display order — mirrors the legacy bottom nav:
//   1. Profile  (athlete.jpg muscular bust)
//   2. Search   (loupe.png)
//   3. Messages (message.png)  ← shows a red badge when there are unread messages
//   4. Settings (reglage.png)
type TabKey = 'profile' | 'search' | 'chat' | 'settings';

interface BottomTabConfig {
  key:      TabKey;
  labelKey: string;
  imageKey: keyof typeof APP_IMAGES;
}

const BOTTOM_TABS: BottomTabConfig[] = [
  { key: 'profile',  labelKey: 'profil',   imageKey: 'athlete'  },
  { key: 'search',   labelKey: 'recherche', imageKey: 'search'   },
  { key: 'chat',     labelKey: 'messages',  imageKey: 'message'  },
  { key: 'settings', labelKey: 'réglage',   imageKey: 'setting'  },
];

// Persistent bottom navigation bar rendered by `app/(private)/_layout.tsx`.
// Visual style matches the legacy app exactly: a light blue rounded "pill"
// background appears around the icon ONLY when the tab is active, and the
// label below it goes bold + dark.
//
// The Messages tab shows a live red unread-count badge sourced directly from
// the Stream Chat WebSocket — no polling, no extra API call.
export function MainBottomNav() {
  const { theme }       = useTheme();
  const { t }           = useTranslation();
  const router          = useRouter();
  const currentPathname = usePathname();
  const safeAreaInsets  = useSafeAreaInsets();
  const loggedInUser    = useAuthenticationStore((store) => store.loggedInUser);

  const currentUserRole = loggedInUser?.role ?? 'athlete';
  const styles          = buildMainBottomNavStyles(theme, safeAreaInsets.bottom);

  // Live unread count — updates via Stream Chat events, 0 when not connected
  const totalUnreadMessages = useUnreadMessageCount();
  const unreadLabel = totalUnreadMessages > 99 ? '99+' : String(totalUnreadMessages);

  // Maps a tab key to the destination route, branching on role for profile/search.
  function getTargetRouteForTab(tabKey: TabKey): string {
    if (tabKey === 'profile') {
      return currentUserRole === 'coach'
        ? '/(private)/(coach)/profile'
        : '/(private)/(athlete)/profile';
    }
    if (tabKey === 'search') {
      return currentUserRole === 'coach'
        ? '/(private)/(coach)/search'
        : '/(private)/(athlete)/search';
    }
    if (tabKey === 'chat')     return '/(private)/chat';
    if (tabKey === 'settings') return '/(private)/settings';
    return '/';
  }

  // Marks a tab as active based on the current path.
  function isTabCurrentlyActive(tabKey: TabKey): boolean {
    if (tabKey === 'profile')  return currentPathname.endsWith('/profile');
    if (tabKey === 'search')   return currentPathname.endsWith('/search');
    if (tabKey === 'chat')     return currentPathname.includes('/chat');
    if (tabKey === 'settings') return currentPathname.includes('/settings');
    return false;
  }

  function handleTabPressed(tabKey: TabKey) {
    if (isTabCurrentlyActive(tabKey)) return;
    router.push(getTargetRouteForTab(tabKey) as never);
  }

  return (
    <View style={styles.navContainer}>
      <View style={styles.tabsRow}>
        {BOTTOM_TABS.map((tab) => {
          const isActive    = isTabCurrentlyActive(tab.key);
          const showBadge   = tab.key === 'chat' && totalUnreadMessages > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPressed(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {/* Wrapper positions the unread badge absolutely over the pill */}
              <View style={styles.iconPillWrapper}>
                <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                  <Image
                    source={APP_IMAGES[tab.imageKey]}
                    style={[styles.tabIcon, !isActive && styles.tabIconInactive]}
                    resizeMode="cover"
                  />
                </View>

                {/* Red unread badge — only visible on the chat tab when count > 0 */}
                {showBadge && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadLabel}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
