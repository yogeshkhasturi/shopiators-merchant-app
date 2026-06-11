import React, { useEffect, useState } from 'react';
import MenuDrawer from '../components/MenuDrawer';

// Error Boundary to catch unexpected render crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Render error captured by ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' }}>
          <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Oops! Something went wrong.</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSessionStore } from '../store/useSessionStore';
import LoginRequiredScreen from './login-required';
import * as Linking from 'expo-linking';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { captureScreenshot } from '../utils/screenshot';
import { notificationService } from '../services/notifications';
import * as SplashScreen from 'expo-splash-screen';
import { logInfo, logError, logDebug } from '../utils/logger';

const WifiOffIcon = WifiOff as any;

// Prevent the splash screen from auto-hiding before we are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const viewRef = React.useRef<any>(null);
  const { isAuthenticated, isSessionLoading, initializeSession, setSession } = useSessionStore();
  const pendingPath = useSessionStore((state) => state.pendingPath);
  const setPendingPath = useSessionStore((state) => state.setPendingPath);
  const router = useRouter();
  const segments: string[] = useSegments();
  
  const [isOffline, setIsOffline] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  // Hide splash screen once session loading is completed
  useEffect(() => {
    if (!isSessionLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isSessionLoading]);

  // Safety fallback: if loading persists too long, reset to avoid permanent splash
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isSessionLoading) {
        logError('Session loading timeout: forced reset of isSessionLoading');
        // Use the new helper method
        useSessionStore.getState().forceStopLoading();
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isSessionLoading]);

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
  const resolveDeepLinkAction = async (url: string) => {
    logInfo(`DeepLink handler invoked with URL: ${url}`);
    try {
      console.log(`[DeepLink] Received URL: ${url}`);
      const parsed = Linking.parse(url);
      console.log(`[DeepLink] Parsed:`, JSON.stringify(parsed));
      const pathString = parsed.path || '';

      // 1. Centralized SSO Callback deep link handling
      console.log(`[DeepLink] Evaluating SSO callback: pathString="${pathString}", hasCode=${!!(parsed.queryParams && parsed.queryParams.code)}`);
      if (pathString === 'auth/callback' || (parsed.queryParams && parsed.queryParams.code)) {
        const { code } = parsed.queryParams as any;
        console.log(`[DeepLink] SSO callback match. Code exists: ${!!code}.`);
        if (code) {
          await useSessionStore.getState().exchangeCodeForToken(code);
        }
        return;
      }

      // 2. Legacy Connection deep link handling
      console.log(`[DeepLink] Evaluating Legacy: pathString="${pathString}", hasToken=${!!(parsed.queryParams && parsed.queryParams.token)}`);
      if (pathString === 'connect' || (parsed.queryParams && parsed.queryParams.token)) {
        const token = parsed.queryParams?.token as string;
        const merchant = parsed.queryParams?.merchant as string;
        let domain = (parsed.queryParams?.domain as string) || 'admin.shopiators.com';

        // Security: Validate domain parameter to prevent redirect hijacking/phishing
        const isDomainValid = 
          domain === 'admin.shopiators.com' ||
          domain.endsWith('.shopiators.com') ||
          domain === 'localhost';

        console.log(`[DeepLink] Legacy match. Token: ${!!token}, Merchant: ${merchant}, Domain: ${domain}, ValidDomain: ${isDomainValid}`);

        if (!isDomainValid) {
          console.warn(`[Security] Gated invalid domain in deep link redirect: ${domain}`);
          domain = 'admin.shopiators.com'; // fallback to safe default
        }

        if (token && merchant) {
          console.log('[DeepLink] Redirecting to /connect modal with legacy params.');
          router.replace({
            pathname: '/connect',
            params: { token, merchant, domain },
          });
        } else {
          console.warn('[DeepLink] Missing token or merchant for legacy redirect');
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
      logError(`DeepLink handling error: ${e}`);
      console.warn('Failed to parse incoming action deep link:', e);
    }
  };

  // Setup deep linking event listener
  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      if (isSessionLoading) {
        console.log(`[DeepLink] Queueing deep link during load: ${event.url}`);
        setInitialUrl(event.url);
      } else {
        resolveDeepLinkAction(event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was launched directly from an external deep link (Cold Start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        if (isSessionLoading) {
          console.log(`[DeepLink] Queueing cold-start deep link: ${url}`);
          setInitialUrl(url);
        } else {
          resolveDeepLinkAction(url);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isSessionLoading]);

  // Process queued initial deep link URL when loading completes
  useEffect(() => {
    if (!isSessionLoading && initialUrl) {
      console.log(`[DeepLink] Processing queued deep link: ${initialUrl}`);
      // Small timeout to ensure Expo Router's navigation container is fully mounted and ready
      const timer = setTimeout(() => {
        resolveDeepLinkAction(initialUrl);
        setInitialUrl(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSessionLoading, initialUrl]);

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

// Capture screenshot after authentication (currently disabled to avoid issues)
// React.useEffect(() => {
//   if (isAuthenticated) {
//     (async () => {
//       const path = await captureScreenshot(viewRef, `screenshot_${Date.now()}`);
//       if (path) {
//         logInfo(`Screenshot saved at ${path}`);
//       } else {
//         logError('Screenshot capture failed');
//       }
//     })();
//   }
// }, [isAuthenticated]);

// Log session loading state changes for debugging
React.useEffect(() => {
  logInfo(`Session loading state changed: ${isSessionLoading}`);
}, [isSessionLoading]);

  if (isSessionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Session Gate: Secure containment around the entire WebView ecosystem
  // Allow bypassing if the active navigation flow is rendering the '(auth)/connect' modal route!
  const isConnecting = segments.includes('(auth)') || segments.includes('connect');
  console.log(`[AuthGate] segments:`, JSON.stringify(segments), `isConnecting:`, isConnecting, `isAuthenticated:`, isAuthenticated);

  if (!isAuthenticated && !isConnecting) {
    return <LoginRequiredScreen />;
  }

  return (
    <ErrorBoundary>
      <View ref={viewRef} style={{ flex: 1 }}>
        <>
          <StatusBar barStyle="light-content" backgroundColor="#030712" />
          {isOffline && (
            <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.offlineBanner}>
              <WifiOffIcon size={14} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.offlineText}>Offline Mode — Please check your network connection</Text>
            </Animated.View>
          )}
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/connect" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="webview-screen" options={{ headerShown: false }} />
          </Stack>
          <MenuDrawer />
        </>
      </View>
    </ErrorBoundary>
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
