import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { LogOut, Store, User, ChevronRight, ExternalLink, X } from 'lucide-react-native';
import { useSessionStore } from '../store/useSessionStore';
import { decodeSessionToken } from '../utils/jwt';
import { DeviceEventEmitter } from 'react-native';

const LogOutIcon = LogOut as any;
const StoreIcon = Store as any;
const UserIcon = User as any;
const ChevronRightIcon = ChevronRight as any;
const ExternalLinkIcon = ExternalLink as any;
const XIcon = X as any;

import { router } from 'expo-router';

interface UserInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserInfoModal({ visible, onClose }: UserInfoModalProps) {
  const { token, merchantSlug, domain, clearSession } = useSessionStore();

  const userDetails = useMemo(() => {
    if (!token) return { initials: 'ME', name: 'Admin User', email: 'admin@shopiators.com', role: 'Admin' };
    const decoded = decodeSessionToken(token);
    if (!decoded) return { initials: 'ME', name: 'Admin User', email: 'admin@shopiators.com', role: 'Admin' };

    const emailInitials = decoded.email ? decoded.email.substring(0, 2).toUpperCase() : 'ME';
    const nameInitials = decoded.userName ? decoded.userName.substring(0, 2).toUpperCase() : emailInitials;
    return {
      initials: nameInitials,
      name: decoded.userName || 'Admin User',
      email: decoded.email || 'admin@shopiators.com',
      role: (decoded.role as string) || 'Admin',
    };
  }, [token]);

  const storeName = useMemo(() => {
    if (!merchantSlug) return 'Merchant Store';
    return merchantSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase());
  }, [merchantSlug]);

  const storeUrl = `https://${domain}/${merchantSlug}`;

  const handleSettingsPress = () => {
    onClose();
    router.push({
      pathname: '/webview-screen',
      params: { path: '/admin/settings/general', title: 'Account Settings' },
    });
  };

  const handleNotificationsPress = () => {
    onClose();
    router.push({
      pathname: '/webview-screen',
      params: { path: '/admin/settings/notifications', title: 'Notifications' },
    });
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await clearSession();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <XIcon size={18} color="#64748b" />
        </TouchableOpacity>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{userDetails.initials}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userDetails.name}</Text>
            <Text style={styles.profileEmail}>{userDetails.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userDetails.role}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Store Info Row */}
        <View style={styles.storeRow}>
          <View style={styles.storeIconBox}>
            <StoreIcon size={16} color="#10b981" />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeLabel}>Current Store</Text>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeUrl} numberOfLines={1}>{storeUrl}</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Action Items */}
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7} onPress={handleSettingsPress}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(129, 140, 248, 0.1)' }]}>
              <UserIcon size={16} color="#818cf8" />
            </View>
            <Text style={styles.actionLabel}>Account Settings</Text>
            <ChevronRightIcon size={16} color="#475569" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7} onPress={handleNotificationsPress}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <ExternalLinkIcon size={16} color="#eab308" />
            </View>
            <Text style={styles.actionLabel}>Notifications</Text>
            <ChevronRightIcon size={16} color="#475569" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7} onPress={handleLogout}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <LogOutIcon size={16} color="#f87171" />
            </View>
            <Text style={[styles.actionLabel, { color: '#f87171' }]}>Disconnect & Log Out</Text>
            <ChevronRightIcon size={16} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Shopiators Companion · v1.0.0</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: '#0d1420',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    backgroundColor: 'rgba(219, 39, 119, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#db2777',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  storeName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  storeUrl: {
    color: '#475569',
    fontSize: 11,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 5,
  },
  liveText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
  },
  actionList: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  footer: {
    color: '#334155',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
