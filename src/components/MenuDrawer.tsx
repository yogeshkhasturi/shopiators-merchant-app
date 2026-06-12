import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  DeviceEventEmitter,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Home,
  BarChart2,
  ShoppingBag,
  Tag,
  Users,
  Megaphone,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp,
  Star,
  Image as ImageIcon,
  Percent,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '../store/useSessionStore';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

const HomeIcon = Home as any;
const BarChart2Icon = BarChart2 as any;
const ShoppingBagIcon = ShoppingBag as any;
const TagIcon = Tag as any;
const UsersIcon = Users as any;
const MegaphoneIcon = Megaphone as any;
const GlobeIcon = Globe as any;
const SettingsIcon = Settings as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronUpIcon = ChevronUp as any;
const StarIcon = Star as any;
const ImageIconCast = ImageIcon as any;
const PercentIcon = Percent as any;

export default function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { merchantSlug, merchantMetadata } = useSessionStore();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    const openSub = DeviceEventEmitter.addListener('open-menu-drawer', () => {
      setIsOpen(true);
      translateX.value = withTiming(0, {
        duration: 320,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      backdropOpacity.value = withTiming(0.55, { duration: 280 });
    });

    const closeSub = DeviceEventEmitter.addListener('close-menu-drawer', () => {
      handleClose();
    });

    return () => {
      openSub.remove();
      closeSub.remove();
    };
  }, []);

  const handleClose = () => {
    translateX.value = withTiming(-DRAWER_WIDTH, {
      duration: 280,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    }, (finished) => {
      if (finished) runOnJS(setIsOpen)(false);
    });
    backdropOpacity.value = withTiming(0, { duration: 220 });
  };

  const getTabRouteForWebPath = (webPath: string): string | null => {
    const cleanPath = webPath.split('?')[0].split('#')[0];
    if (cleanPath === '/admin/dashboard') return '/';
    if (cleanPath.startsWith('/admin/orders') || cleanPath.startsWith('/admin/draft_orders') || cleanPath.startsWith('/admin/checkouts')) return '/orders';
    if (cleanPath.startsWith('/admin/products') || cleanPath.startsWith('/admin/collections') || cleanPath.startsWith('/admin/inventory') || cleanPath.startsWith('/admin/purchase_orders') || cleanPath.startsWith('/admin/transfers') || cleanPath.startsWith('/admin/gift_cards')) return '/products';
    if (cleanPath.startsWith('/admin/customers') || cleanPath.startsWith('/admin/segments')) return '/customers';
    if (cleanPath.startsWith('/admin/settings')) return '/profile';
    return null;
  };

  const handleNavigation = (webPath: string) => {
    const tabRoute = getTabRouteForWebPath(webPath);
    if (tabRoute) {
      router.push(tabRoute as any);
      setTimeout(() => DeviceEventEmitter.emit('navigate-web-path', webPath), 150);
    } else {
      let title = 'Admin';
      if (webPath.includes('discounts')) title = 'Discounts';
      else if (webPath.includes('marketing')) title = 'Marketing';
      else if (webPath.includes('media') || webPath.includes('files')) title = 'Media Library';
      else if (webPath.includes('currencies')) title = 'Currency';
      else if (webPath.includes('reviews')) title = 'Product Reviews';
      router.push({ pathname: '/webview-screen', params: { path: webPath, title } });
    }
    handleClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const initials = (merchantMetadata?.userName || merchantSlug || 'AD').substring(0, 2).toUpperCase();

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: isOpen ? 'auto' : 'none' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1523" />

      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top }]}>

        {/* Header — Logo */}
        <View style={styles.drawerHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>S</Text>
            </View>
            <Text style={styles.logoText}>Shopiators</Text>
          </View>
        </View>

        {/* Navigation Links */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* MAIN */}
          <Text style={styles.sectionLabel}>MAIN</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/dashboard')}>
            <HomeIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, styles.activeMenuRow]} activeOpacity={0.7} onPress={() => handleNavigation('/admin/dashboard')}>
            <BarChart2Icon size={20} color="#60a5fa" />
            <Text style={[styles.menuText, styles.activeMenuText]}>Dashboard</Text>
          </TouchableOpacity>

          {/* COMMERCE */}
          <Text style={styles.sectionLabel}>COMMERCE</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('sales')}>
            <ShoppingBagIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Sales</Text>
            {expandedSection === 'sales' ? <ChevronUpIcon size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDownIcon size={16} color="rgba(255,255,255,0.4)" />}
          </TouchableOpacity>
          {expandedSection === 'sales' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/orders')}><View style={styles.dot} /><Text style={styles.subMenuText}>All Orders</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/draft_orders')}><View style={styles.dot} /><Text style={styles.subMenuText}>Drafts</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/checkouts')}><View style={styles.dot} /><Text style={styles.subMenuText}>Abandoned checkouts</Text></TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('products')}>
            <TagIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Products</Text>
            {expandedSection === 'products' ? <ChevronUpIcon size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDownIcon size={16} color="rgba(255,255,255,0.4)" />}
          </TouchableOpacity>
          {expandedSection === 'products' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/products')}><View style={styles.dot} /><Text style={styles.subMenuText}>All products</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/collections')}><View style={styles.dot} /><Text style={styles.subMenuText}>Collections</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/inventory')}><View style={styles.dot} /><Text style={styles.subMenuText}>Inventory</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/purchase_orders')}><View style={styles.dot} /><Text style={styles.subMenuText}>Purchase orders</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/gift_cards')}><View style={styles.dot} /><Text style={styles.subMenuText}>Gift cards</Text></TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/settings/currencies')}>
            <GlobeIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Currency</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/product-reviews')}>
            <StarIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Product Reviews</Text>
          </TouchableOpacity>

          {/* MARKETING */}
          <Text style={styles.sectionLabel}>MARKETING</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('marketing')}>
            <MegaphoneIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Marketing</Text>
            {expandedSection === 'marketing' ? <ChevronUpIcon size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDownIcon size={16} color="rgba(255,255,255,0.4)" />}
          </TouchableOpacity>
          {expandedSection === 'marketing' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/marketing')}><View style={styles.dot} /><Text style={styles.subMenuText}>Overview</Text></TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} onPress={() => handleNavigation('/admin/discounts')}><View style={styles.dot} /><Text style={styles.subMenuText}>Discounts</Text></TouchableOpacity>
            </View>
          )}

          {/* STORE */}
          <Text style={styles.sectionLabel}>STORE</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/settings/general')}>
            <PercentIcon size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Store Management</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/content/files')}>
            <ImageIconCast size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.menuText}>Media Library</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Footer — Administrator */}
        <TouchableOpacity
          style={[styles.adminFooter, { marginBottom: insets.bottom + 12 }]}
          activeOpacity={0.8}
          onPress={() => handleNavigation('/admin/settings/general')}
        >
          <View style={styles.adminAvatar}>
            <Text style={styles.adminAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.adminName}>Administrator</Text>
          <SettingsIcon size={15} color="rgba(255,255,255,0.4)" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0f1523',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 1,
    gap: 12,
  },
  activeMenuRow: {
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  menuText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  subMenu: {
    paddingLeft: 44,
    paddingBottom: 4,
  },
  subMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  subMenuText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '400',
  },
  adminFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  adminName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
