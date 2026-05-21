import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Package, Users, Menu } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { appBridge } from '../../services/app-bridge';

const HomeIcon = Home as any;
const ShoppingBagIcon = ShoppingBag as any;
const PackageIcon = Package as any;
const UsersIcon = Users as any;
const MenuIcon = Menu as any;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#818cf8', // Electric indigo
        tabBarInactiveTintColor: '#64748b', // Cool slate
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={20} />,
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBagIcon color={color} size={20} />,
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <PackageIcon color={color} size={20} />,
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => <UsersIcon color={color} size={20} />,
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MenuIcon color={color} size={20} />,
        }}
        listeners={{
          tabPress: () => { appBridge.executeHaptic('selection'); }
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
  },
});
