import React from 'react';
import { Tabs } from 'expo-router';
import { Search, Home, ShoppingBag, Tag, Menu } from 'lucide-react-native';
import { StyleSheet, View, Text, TouchableOpacity, DeviceEventEmitter, Platform } from 'react-native';
import { appBridge } from '../../services/app-bridge';
import { useSessionStore } from '../../store/useSessionStore';
import { decodeSessionToken } from '../../utils/jwt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SearchIcon = Search as any;
const HomeIcon = Home as any;
const ShoppingBagIcon = ShoppingBag as any;
const TagIcon = Tag as any;
const MenuIcon = Menu as any;

export default function TabsLayout() {
  const { token } = useSessionStore();
  const insets = useSafeAreaInsets();

  const userInitials = React.useMemo(() => {
    if (!token) return 'AD';
    const decoded = decodeSessionToken(token);
    if (!decoded) return 'AD';
    const emailInitials = decoded.email ? decoded.email.substring(0, 2).toUpperCase() : 'AD';
    return decoded.userName ? decoded.userName.substring(0, 2).toUpperCase() : emailInitials;
  }, [token]);

  // Helper to render Shopify tab bar button design
  const renderTabIcon = (IconComponent: any, color: string, focused: boolean) => {
    return (
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <IconComponent color={focused ? '#000000' : '#64748b'} size={22} />
      </View>
    );
  };

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarTransparent: true,
        tabBarStyle: [
          styles.tabBar,
          { 
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
          }
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, focused }) => renderTabIcon(SearchIcon, color, focused),
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => renderTabIcon(HomeIcon, color, focused),
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color, focused }) => renderTabIcon(ShoppingBagIcon, color, focused),
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ color, focused }) => renderTabIcon(TagIcon, color, focused),
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ color, focused }) => renderTabIcon(MenuIcon, color, focused),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Intercept and prevent navigation to more screen
            appBridge.executeHaptic('selection');
            DeviceEventEmitter.emit('open-menu-drawer');
          }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.avatarContainer, focused && styles.avatarContainerActive]}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
              {/* Green status indicator dot matching Shopify screenshot */}
              <View style={styles.statusDot} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      {/* Hidden legacy customer tab from bottom menu, kept inside router */}
      <Tabs.Screen
        name="customers"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 20,
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tabBarItem: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle active highlight
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainerActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e', // Green status indicator dot
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
