import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Switch } from 'react-native';
import { useSessionStore } from '../../store/useSessionStore';
import { Settings, LogOut, Shield, ChevronRight, HelpCircle, Bell, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { decodeSessionToken } from '../../utils/jwt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsIcon = Settings as any;
const LogOutIcon = LogOut as any;
const ShieldIcon = Shield as any;
const ChevronRightIcon = ChevronRight as any;
const HelpCircleIcon = HelpCircle as any;
const BellIcon = Bell as any;
const ArrowUpRightIcon = ArrowUpRight as any;

export default function ProfileTab() {
  const { token, merchantSlug, clearSession, domain } = useSessionStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Decode the user token dynamically for initials
  const userDetails = useMemo(() => {
    if (!token) return { initials: 'ME', name: 'Owner', email: 'merchant@shopiators.com' };
    const decoded = decodeSessionToken(token);
    if (!decoded) return { initials: 'ME', name: 'Owner', email: 'merchant@shopiators.com' };

    const emailInitials = decoded.email ? decoded.email.substring(0, 2).toUpperCase() : 'ME';
    const nameInitials = decoded.userName ? decoded.userName.substring(0, 2).toUpperCase() : emailInitials;
    return {
      initials: nameInitials,
      name: decoded.userName || 'Owner',
      email: decoded.email || 'merchant@shopiators.com'
    };
  }, [token]);

  const handleLogout = async () => {
    await clearSession();
  };

  const handleOpenSettingPath = (path: string) => {
    router.push({
      pathname: '/webview-screen',
      params: { path, title: 'Settings' },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Shopify-style Avatar Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{userDetails.initials}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>{userDetails.name}</Text>
            <Text style={styles.storeRole}>{userDetails.email}</Text>
            <Text style={styles.storeUrl}>{domain}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{merchantSlug}</Text>
          </View>
        </View>

        {/* Shortcuts Section */}
        <Text style={styles.sectionHeader}>Admin Settings WebView Shortcuts</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7} 
            onPress={() => handleOpenSettingPath('/admin/settings/general')}
          >
            <View style={styles.menuIconContainer}>
              <SettingsIcon size={18} color="#818cf8" />
            </View>
            <Text style={styles.menuLabel}>General Shop Settings</Text>
            <ChevronRightIcon size={16} color="#475569" style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7} 
            onPress={() => handleOpenSettingPath('/admin/settings/shipping')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <ArrowUpRightIcon size={18} color="#c084fc" />
            </View>
            <Text style={styles.menuLabel}>Shipping & Delivery</Text>
            <ChevronRightIcon size={16} color="#475569" style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7} 
            onPress={() => handleOpenSettingPath('/admin/settings/taxes')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <ShieldIcon size={18} color="#4ade80" />
            </View>
            <Text style={styles.menuLabel}>Taxes & Duties</Text>
            <ChevronRightIcon size={16} color="#475569" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>Native Shell Preferences</Text>
        <View style={styles.cardGroup}>
          <View style={styles.prefItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <BellIcon size={18} color="#f87171" />
            </View>
            <View style={styles.prefLabelContainer}>
              <Text style={styles.prefLabel}>Push Alerts</Text>
              <Text style={styles.prefSublabel}>Order COD and low stock alerts</Text>
            </View>
            <Switch 
              value={pushEnabled} 
              onValueChange={setPushEnabled}
              trackColor={{ false: '#1e293b', true: '#818cf8' }}
              thumbColor={pushEnabled ? '#ffffff' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Help & Logout Section */}
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
              <HelpCircleIcon size={18} color="#94a3b8" />
            </View>
            <Text style={styles.menuLabel}>Get Support</Text>
            <ChevronRightIcon size={16} color="#475569" style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogout}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <LogOutIcon size={18} color="#f87171" />
            </View>
            <Text style={[styles.menuLabel, { color: '#f87171' }]}>Disconnect Phone</Text>
            <ChevronRightIcon size={16} color="#475569" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Version Footer */}
        <Text style={styles.footerVersion}>Shopiators Companion App v1.0.0 (Hybrid)</Text>
        <Text style={styles.footerCopyright}>© 2026 Webiators Tech. All rights reserved.</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 28,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    backgroundColor: 'rgba(129, 140, 248, 0.25)', // Hot pink avatar outline ring
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#db2777', // Hot Pink profile avatar
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  storeRole: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 1,
  },
  storeUrl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  prefLabelContainer: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  prefSublabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  footerVersion: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    marginTop: 20,
  },
  footerCopyright: {
    fontSize: 10,
    color: '#334155',
    textAlign: 'center',
    marginTop: 4,
  },
});
