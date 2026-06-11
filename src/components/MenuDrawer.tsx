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
  ShoppingBag,
  Tag,
  Users,
  Megaphone,
  Percent,
  Layers,
  Globe,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

const HomeIcon = Home as any;
const ShoppingBagIcon = ShoppingBag as any;
const TagIcon = Tag as any;
const UsersIcon = Users as any;
const MegaphoneIcon = Megaphone as any;
const PercentIcon = Percent as any;
const LayersIcon = Layers as any;
const GlobeIcon = Globe as any;
const SettingsIcon = Settings as any;
const XIcon = X as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronUpIcon = ChevronUp as any;
const QrCodeIcon = QrCode as any;

export default function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('products'); // Default products expanded

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    const openSub = DeviceEventEmitter.addListener('open-menu-drawer', () => {
      setIsOpen(true);
      translateX.value = withTiming(0, {
        duration: 320,
        easing: Easing.bezier(0.16, 1, 0.3, 1), // Premium snappier ease-out curve
      });
      backdropOpacity.value = withTiming(0.45, { duration: 280 });
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
      if (finished) {
        runOnJS(setIsOpen)(false);
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 220 });
  };

  const getTabRouteForWebPath = (webPath: string): string | null => {
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
    return null;
  };

  const handleNavigation = (webPath: string) => {
    console.log('[MenuDrawer] Triggering navigation to:', webPath);
    const tabRoute = getTabRouteForWebPath(webPath);
    
    if (tabRoute) {
      console.log('[MenuDrawer] Switching to tab:', tabRoute);
      router.push(tabRoute as any);
      setTimeout(() => {
        DeviceEventEmitter.emit('navigate-web-path', webPath);
      }, 150);
    } else {
      console.log('[MenuDrawer] Opening in webview-screen:', webPath);
      let title = 'Admin';
      if (webPath.includes('discounts')) title = 'Discounts';
      router.push({
        pathname: '/webview-screen',
        params: { path: webPath, title: title },
      });
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

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: isOpen ? 'auto' : 'none' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Drawer Content */}
      <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Menu Items */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/dashboard')}>
            <HomeIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>

          {/* Orders Section */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('orders')}>
            <ShoppingBagIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Orders</Text>
            {expandedSection === 'orders' ? (
              <ChevronUpIcon size={18} color="#5c5f62" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'orders' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/orders')}>
                <Text style={styles.subMenuText}>All Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/draft_orders')}>
                <Text style={styles.subMenuText}>Drafts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/checkouts')}>
                <Text style={styles.subMenuText}>Abandoned checkouts</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Products Section */}
          <TouchableOpacity
            style={[styles.menuRow, expandedSection === 'products' && styles.activeMenuRow]}
            activeOpacity={0.7}
            onPress={() => toggleSection('products')}
          >
            <TagIcon size={22} color={expandedSection === 'products' ? '#008060' : '#5c5f62'} />
            <Text style={[styles.menuText, expandedSection === 'products' && styles.activeMenuText]}>Products</Text>
            {expandedSection === 'products' ? (
              <ChevronUpIcon size={18} color="#008060" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'products' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/products')}>
                <Text style={styles.subMenuText}>All products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/collections')}>
                <Text style={styles.subMenuText}>Collections</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/inventory')}>
                <Text style={styles.subMenuText}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/purchase_orders')}>
                <Text style={styles.subMenuText}>Purchase orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/transfers')}>
                <Text style={styles.subMenuText}>Transfers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/gift_cards')}>
                <Text style={styles.subMenuText}>Gift cards</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subMenuRow, styles.scanInventoryRow]} activeOpacity={0.7} onPress={() => handleNavigation('/admin/products/scan')}>
                <QrCodeIcon size={16} color="#5c5f62" style={{ marginRight: 8 }} />
                <Text style={styles.subMenuText}>Scan inventory</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Customers */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('customers')}>
            <UsersIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Customers</Text>
            {expandedSection === 'customers' ? (
              <ChevronUpIcon size={18} color="#5c5f62" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'customers' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/customers')}>
                <Text style={styles.subMenuText}>All customers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/segments')}>
                <Text style={styles.subMenuText}>Segments</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Marketing */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('marketing')}>
            <MegaphoneIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Marketing</Text>
            {expandedSection === 'marketing' ? (
              <ChevronUpIcon size={18} color="#5c5f62" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'marketing' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/marketing')}>
                <Text style={styles.subMenuText}>Overview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/marketing/campaigns')}>
                <Text style={styles.subMenuText}>Campaigns</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/marketing/automations')}>
                <Text style={styles.subMenuText}>Automations</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Discounts */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/discounts')}>
            <PercentIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Discounts</Text>
          </TouchableOpacity>

          {/* Content */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('content')}>
            <LayersIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Content</Text>
            {expandedSection === 'content' ? (
              <ChevronUpIcon size={18} color="#5c5f62" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'content' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/content/metaobjects')}>
                <Text style={styles.subMenuText}>Metaobjects</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/content/files')}>
                <Text style={styles.subMenuText}>Files</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Markets */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => toggleSection('markets')}>
            <GlobeIcon size={22} color="#5c5f62" />
            <Text style={styles.menuText}>Markets</Text>
            {expandedSection === 'markets' ? (
              <ChevronUpIcon size={18} color="#5c5f62" />
            ) : (
              <ChevronDownIcon size={18} color="#5c5f62" />
            )}
          </TouchableOpacity>
          {expandedSection === 'markets' && (
            <View style={styles.subMenu}>
              <TouchableOpacity style={styles.subMenuRow} activeOpacity={0.7} onPress={() => handleNavigation('/admin/markets')}>
                <Text style={styles.subMenuText}>Markets</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Floating Control Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8} onPress={() => handleNavigation('/admin/settings/general')}>
            <SettingsIcon size={18} color="#1a1a1a" style={{ marginRight: 8 }} />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={handleClose}>
            <XIcon size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

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
    backgroundColor: '#ffffff', // White drawer body background
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'space-between',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  activeMenuRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  menuText: {
    flex: 1,
    color: '#1a1a1a', // Dark menu label color
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14,
  },
  activeMenuText: {
    color: '#000000',
  },
  subMenu: {
    paddingLeft: 46,
    marginBottom: 8,
  },
  subMenuRow: {
    paddingVertical: 10,
  },
  scanInventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subMenuText: {
    color: '#5c5f62', // Cool gray sub-menu label color
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  settingsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f6f6f7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f6f6f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
});
