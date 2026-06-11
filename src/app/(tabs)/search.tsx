import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Keyboard,
} from 'react-native';
import { Search, X, Clock, TrendingUp, Package, ShoppingBag, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { DeviceEventEmitter } from 'react-native';

const SearchIcon = Search as any;
const XIcon = X as any;
const ClockIcon = Clock as any;
const TrendingUpIcon = TrendingUp as any;
const PackageIcon = Package as any;
const ShoppingBagIcon = ShoppingBag as any;
const UsersIcon = Users as any;

import { router } from 'expo-router';

const recentSearches = [
  'Pending orders',
  'Low stock products',
  'Customer refunds',
  "Monk's Trade settings",
  'COD dashboard',
];

const quickNavLinks = [
  { label: 'Orders', icon: ShoppingBagIcon, color: '#818cf8', path: '/admin/orders?tab=all' },
  { label: 'Products', icon: PackageIcon, color: '#22c55e', path: '/admin/products' },
  { label: 'Customers', icon: UsersIcon, color: '#f59e0b', path: '/admin/customers' },
  { label: 'Analytics', icon: TrendingUpIcon, color: '#ec4899', path: '/admin/dashboard' },
];

export default function SearchTab() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();

  // Auto-focus the search input when this tab becomes active (Shopify style)
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      Keyboard.dismiss();
    }
  }, [isFocused]);

  const handleChipPress = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const getTabRouteForWebPath = (webPath: string): string => {
    const cleanPath = webPath.split('?')[0].split('#')[0];
    if (cleanPath === '/admin/dashboard') {
      return '/';
    }
    if (
      cleanPath.startsWith('/admin/orders') ||
      cleanPath.startsWith('/admin/draft_orders') ||
      cleanPath.startsWith('/admin/checkouts')
    ) {
      return '/orders';
    }
    if (
      cleanPath.startsWith('/admin/products') ||
      cleanPath.startsWith('/admin/collections') ||
      cleanPath.startsWith('/admin/inventory') ||
      cleanPath.startsWith('/admin/purchase_orders') ||
      cleanPath.startsWith('/admin/transfers') ||
      cleanPath.startsWith('/admin/gift_cards')
    ) {
      return '/products';
    }
    if (cleanPath.startsWith('/admin/customers') || cleanPath.startsWith('/admin/segments')) {
      return '/customers';
    }
    if (cleanPath.startsWith('/admin/settings')) {
      return '/profile';
    }
    return '/';
  };

  const handleQuickNav = (path: string) => {
    const tabRoute = getTabRouteForWebPath(path);
    router.push(tabRoute as any);
    setTimeout(() => {
      DeviceEventEmitter.emit('navigate-web-path', path);
    }, 150);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* ── Shopify-style top search bar ── */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#818cf8" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            placeholder="Search Shopiators admin…"
            placeholderTextColor="#475569"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); inputRef.current?.focus(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => {
            setQuery('');
            inputRef.current?.blur(); // blur FIRST so keyboard closes properly
            Keyboard.dismiss();
            router.push('/'); // Close search and return to Home tab
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Navigation */}
        <Text style={styles.sectionLabel}>QUICK NAVIGATION</Text>
        <View style={styles.quickGrid}>
          {quickNavLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                activeOpacity={0.75}
                onPress={() => handleQuickNav(item.path)}
              >
                <View style={[styles.quickIconBox, { backgroundColor: `${item.color}18` }]}>
                  <Icon size={20} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Searches */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>RECENT SEARCHES</Text>
        <View style={styles.recentList}>
          {recentSearches.map((term, i) => (
            <TouchableOpacity
              key={i}
              style={styles.recentRow}
              activeOpacity={0.7}
              onPress={() => handleChipPress(term)}
            >
              <ClockIcon size={14} color="#475569" style={styles.recentIcon} />
              <Text style={styles.recentText}>{term}</Text>
              <XIcon size={12} color="#334155" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon Card */}
        <View style={styles.comingSoonCard}>
          <SearchIcon size={32} color="#1e293b" />
          <Text style={styles.comingSoonTitle}>Live Search is coming soon</Text>
          <Text style={styles.comingSoonSub}>
            Search orders, products, customers, and pages natively — right here!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.35)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  recentList: {
    backgroundColor: 'rgba(30,41,59,0.3)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  comingSoonCard: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.2)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    gap: 8,
  },
  comingSoonTitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  comingSoonSub: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
