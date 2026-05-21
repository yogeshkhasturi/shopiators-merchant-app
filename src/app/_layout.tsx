import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSessionStore } from '../store/useSessionStore';
import LoginRequiredScreen from './login-required';
import * as Linking from 'expo-linking';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { notificationService } from '../services/notifications';

const WifiOffIcon = WifiOff as any;

export default function RootLayout() {
  const { isAuthenticated, isSessionLoading, initializeSession } = useSessionStore();
  const pendingPath = useSessionStore((state) => state.pendingPath);
  const setPendingPath = useSessionStore((state) => state.setPendingPath);
  const router = useRouter();
  
  const [isOffline, setIsOffline] = useState(false);

  // Load session from SecureStore on app launch
  useEffect(() => {
    initializeSession();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  // Setup Push Notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Request permissions and register token
    notificationService.registerForPushNotificationsAsync();

    // Listen for incoming clicked notifications
    const unsubscribe = notificationService.setupNotificationListeners(router);

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Deep Link Action Resolution (Warm and Cold Starts)
  const resolveDeepLinkAction = (url: string) => {
    try {
      const parsed = Linking.parse(url);
      const pathString = parsed.path || '';

      // 1. Centralized SSO Callback deep link handling
      if (pathString === 'auth/callback' || (parsed.queryParams && parsed.queryParams.code)) {
        const code = parsed.queryParams?.code as string;
        if (code) {
          router.replace({
            pathname: '/(auth)/connect',
            params: { code },
          });
        }
        return;
      }

      // 2. Legacy Connection deep link handling
      if (pathString === 'connect' || (parsed.queryParams && parsed.queryParams.token)) {
        const token = parsed.queryParams?.token as string;
        const merchant = parsed.queryParams?.merchant as string;
        let domain = (parsed.queryParams?.domain as string) || 'admin.shopiators.com';

        // Security: Validate domain parameter to prevent redirect hijacking/phishing
        const isDomainValid = 
          domain === 'admin.shopiators.com' ||
          domain.endsWith('.shopiators.com') ||
          domain === 'localhost';

        if (!isDomainValid) {
          console.warn(`[Security] Gated invalid domain in deep link redirect: ${domain}`);
          domain = 'admin.shopiators.com'; // fallback to safe default
        }

        if (token && merchant) {
          router.replace({
            pathname: '/(auth)/connect',
            params: { token, merchant, domain },
          });
        }
        return;
      }

      // 2. Action paths (e.g. shopiators://orders/8472 or shopiators://products/101)
      if (pathString.startsWith('orders/') || pathString.startsWith('products/')) {
        const [category, id] = pathString.split('/');
        if (id) {
          const targetPath = `/admin/${category}/${id}`;
          
          if (useSessionStore.getState().isAuthenticated) {
            const titleName = category === 'orders' ? `Order #${id}` : `Product #${id}`;
            router.push({
              pathname: '/webview-screen',
              params: { path: targetPath, title: titleName },
            });
          } else {
            console.log(`[DeepLink] Gated route queued for auth callback: ${targetPath}`);
            useSessionStore.getState().setPendingPath(targetPath);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse incoming action deep link:', e);
    }
  };

  // Setup deep linking event listener
  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      resolveDeepLinkAction(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was launched directly from an external deep link (Cold Start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        resolveDeepLinkAction(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, router]);

  // Auth Continuity Trigger: Open queued routes immediately upon successful login/handshake
  useEffect(() => {
    if (isAuthenticated && pendingPath) {
      const parts = pendingPath.replace('/admin/', '').split('/');
      const category = parts[0];
      const id = parts[1];
      const titleName = category === 'orders' ? `Order #${id}` : `Product #${id}`;
      
      setTimeout(() => {
        router.push({
          pathname: '/webview-screen',
          params: { path: pendingPath, title: titleName },
        });
        setPendingPath(null);
      }, 600);
    }
  }, [isAuthenticated, pendingPath]);

  if (isSessionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Session Gate: Secure containment around the entire WebView ecosystem
  if (!isAuthenticated) {
    return <LoginRequiredScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      {isOffline && (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.offlineBanner}>
          <WifiOffIcon size={14} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.offlineText}>Offline Mode — Please check your network connection</Text>
        </Animated.View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/connect" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    position: 'absolute',
    top: 50, // Floating beautifully just below notch/status bar
    left: 16,
    right: 16,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
