import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, DeviceEventEmitter, StatusBar, Platform } from 'react-native';
import { Bell, Plus, MoreVertical, ChevronDown, Search, Settings, ArrowLeft, Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '../store/useSessionStore';
import { decodeSessionToken } from '../utils/jwt';
import { useRouter } from 'expo-router';

const BellIcon = Bell as any;
const PlusIcon = Plus as any;
const MoreVerticalIcon = MoreVertical as any;
const ChevronDownIcon = ChevronDown as any;
const SearchIcon = Search as any;
const SettingsIcon = Settings as any;
const ArrowLeftIcon = ArrowLeft as any;
const MenuIcon = Menu as any;

interface HeaderProps {
  title?: string;
  variant?: 'home' | 'products' | 'orders' | 'customers' | 'profile' | 'search' | 'default';
  onBackPress?: () => void;
  showBack?: boolean;
}

export default function Header({
  title = 'Dashboard',
  variant = 'default',
  onBackPress,
  showBack = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, merchantSlug } = useSessionStore();
  const [notificationCount, setNotificationCount] = useState(0);

  // Subscribe to live notification count updates from webview bridge
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('update-notification-count', (count: number) => {
      setNotificationCount(count);
    });
    return () => sub.remove();
  }, []);

  // Dynamic top padding to account for device notches and status bars
  const topPadding = useMemo(() => {
    const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
    return Math.max(statusBarHeight, 12);
  }, [insets.top]);

  // Decode user initials
  const userDetails = useMemo(() => {
    if (!token) return { initials: 'ME', name: 'Admin' };
    const decoded = decodeSessionToken(token);
    if (!decoded) return { initials: 'ME', name: 'Admin' };

    const emailInitials = decoded.email ? decoded.email.substring(0, 2).toUpperCase() : 'ME';
    const nameInitials = decoded.userName ? decoded.userName.substring(0, 2).toUpperCase() : emailInitials;
    return {
      initials: nameInitials,
      name: decoded.userName || 'Admin',
    };
  }, [token]);

  // Store initials/badge (e.g. Monk's Trade -> MT)
  const storeBadge = useMemo(() => {
    if (!merchantSlug) return 'MT';
    return merchantSlug
      .split('-')
      .map((word) => word[0])
      .join('')
      .substring(0, 3)
      .toUpperCase();
  }, [merchantSlug]);

  // Format Store Display Name
  const storeName = useMemo(() => {
    if (!merchantSlug) return 'Merchant Store';
    return merchantSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [merchantSlug]);

  const handleNotificationPress = () => {
    console.log('[Header] Bell pressed. Triggering web notification panel.');
    DeviceEventEmitter.emit('trigger-web-notification');
  };

  const handleProfilePress = () => {
    console.log('[Header] Avatar pressed. Opening user info modal.');
    DeviceEventEmitter.emit('open-user-info-modal');
  };

  const handlePlusPress = () => {
    console.log('[Header] Add button pressed for variant:', variant);
    if (variant === 'products') {
      DeviceEventEmitter.emit('navigate-web-path', '/admin/products/new');
    } else if (variant === 'orders') {
      DeviceEventEmitter.emit('navigate-web-path', '/admin/draft_orders/new');
    } else if (variant === 'customers') {
      DeviceEventEmitter.emit('navigate-web-path', '/admin/customers/new');
    }
  };

  const handleActionsPress = () => {
    console.log('[Header] Actions menu pressed');
    // Open action sheets or emit event
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
      <View style={styles.headerContent}>
        
        {/* Left Side: Back button or Hamburger + Main brand/title */}
        <View style={styles.leftContainer}>
          {showBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress || (() => router.back())}>
              <ArrowLeftIcon size={22} color="#1a1a1a" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => DeviceEventEmitter.emit('open-menu-drawer')}
              activeOpacity={0.7}
            >
              <MenuIcon size={22} color="#1a1a1a" />
            </TouchableOpacity>
          )}

          {variant === 'home' ? (
            <TouchableOpacity style={styles.storePill} activeOpacity={0.7} onPress={handleProfilePress}>
              <View style={styles.storeBadge}>
                <Text style={styles.storeBadgeText}>{storeBadge}</Text>
              </View>
              <Text style={styles.storeNameText} numberOfLines={1}>
                {storeName}
              </Text>
              <ChevronDownIcon size={16} color="#5c5f62" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : (
            <View style={styles.pageTitleWrapper}>
              <Text style={styles.pageTitleText}>{title}</Text>
            </View>
          )}
        </View>

        {/* Right Side Actions based on Page Variant */}
        <View style={styles.actionGroup}>
          {/* Global Notification Bell across main screens */}
          {!showBack && variant !== 'search' && (
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7} 
              onPress={handleNotificationPress}
            >
              <BellIcon size={20} color="#5c5f62" />
              {notificationCount > 0 && (
                <View style={styles.badgeIndicator}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {variant === 'home' && (
            /* Profile Initials Avatar Pill */
            <TouchableOpacity 
              style={styles.avatarButton} 
              activeOpacity={0.7} 
              onPress={handleProfilePress}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{userDetails.initials}</Text>
              </View>
            </TouchableOpacity>
          )}

          {(variant === 'products' || variant === 'customers') && (
            <>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={handlePlusPress}>
                <PlusIcon size={20} color="#1a1a1a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={handleActionsPress}>
                <MoreVerticalIcon size={20} color="#5c5f62" />
              </TouchableOpacity>
            </>
          )}

          {variant === 'orders' && (
            <>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => DeviceEventEmitter.emit('navigate-web-path', '/admin/orders/search')}>
                <SearchIcon size={18} color="#5c5f62" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={handlePlusPress}>
                <PlusIcon size={20} color="#1a1a1a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={handleActionsPress}>
                <MoreVerticalIcon size={20} color="#5c5f62" />
              </TouchableOpacity>
            </>
          )}

          {variant === 'profile' && (
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => router.push('/(tabs)/more')}>
              <SettingsIcon size={20} color="#5c5f62" />
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff', // White matching Shopify mobile header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#008060', // Shopify Emerald Green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  storeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  storeNameText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '800',
    maxWidth: 160,
  },
  pageTitleText: {
    color: '#1a1a1a',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
