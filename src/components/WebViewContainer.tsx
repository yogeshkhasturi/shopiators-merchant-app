import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, BackHandler, Platform, RefreshControl, ScrollView, Text, TouchableOpacity } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSessionStore } from '../store/useSessionStore';
import { AlertCircle, RotateCw, WifiOff } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { appBridge } from '../services/app-bridge';

const WifiOffIcon = WifiOff as any;
const RotateCwIcon = RotateCw as any;

interface WebViewContainerProps {
  /**
   * The subpath on the admin panel (e.g., '/admin/dashboard' or '/admin/orders')
   */
  path: string;
}

export default function WebViewContainer({ path }: WebViewContainerProps) {
  const webViewRef = useRef<WebView>(null);
  const { token, merchantSlug, domain, clearSession } = useSessionStore();
  
  const [bootstrapState, setBootstrapState] = useState<'bootstrapping' | 'success' | 'error'>('bootstrapping');
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScrollAtTop, setIsScrollAtTop] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Perform the WebView SSO Session Bootstrapping Handshake
  const bootstrapWebViewSession = async (isRetry = false) => {
    try {
      setBootstrapState('bootstrapping');
      setHasError(false);

      const { token: currentToken, expiresAt, refreshSession } = useSessionStore.getState();
      let activeToken = currentToken;

      // 1. Silent refresh check if access token is expired or expiring soon
      if (expiresAt && Date.now() + 60000 >= expiresAt) {
        console.log('[Bootstrap] Mobile session near expiration. Silent refreshing first...');
        const refreshed = await refreshSession();
        if (refreshed) {
          activeToken = useSessionStore.getState().token;
        } else {
          throw new Error('Failed to refresh access token during WebView bootstrap.');
        }
      }

      if (!activeToken) {
        throw new Error('Access token is missing. Login session required.');
      }

      // 2. Execute secure POST /mobile/webview/bootstrap
      const bootstrapEndpoint = `https://${domain}/mobile/webview/bootstrap`;
      console.log(`[Bootstrap] Performing web session sync on: ${bootstrapEndpoint}...`);

      const response = await fetch(bootstrapEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ merchantSlug }),
      });

      if (response.status === 401 && !isRetry) {
        console.warn('[Bootstrap] Bootstrap returned 401. Retrying with a fresh token...');
        const refreshed = await refreshSession();
        if (refreshed) {
          // Retry bootstrap once with refreshed token
          await bootstrapWebViewSession(true);
          return;
        } else {
          throw new Error('Session bootstrap returned 401 and token refresh failed.');
        }
      }

      if (!response.ok) {
        throw new Error(`Session bootstrap failed with status ${response.status}`);
      }

      console.log('[Bootstrap] Web session established and cookie synchronized successfully.');
      setBootstrapState('success');
    } catch (err) {
      console.error('[Bootstrap] Session bootstrap encountered a critical error:', err);
      setBootstrapState('error');
      setHasError(true);
      
      // If authentications are explicitly stale or unauthorized, log out
      if (err instanceof Error && (
        err.message.includes('Login session required') ||
        err.message.includes('401') ||
        err.message.includes('refresh') ||
        err.message.includes('unauthorized')
      )) {
        console.warn('[Bootstrap] Auth session is permanently stale, clearing and logging out...');
        clearSession();
      }
    }
  };

  // Re-trigger bootstrapping if merchant credentials or target routes change
  useEffect(() => {
    bootstrapWebViewSession();
  }, [domain, token, merchantSlug]);

  // Construct the direct authenticated admin panel route URL
  const targetUrl = useMemo(() => {
    const redirectQuery = path.includes('?') ? '&mobile_app=1' : '?mobile_app=1';
    return `https://${domain}/${merchantSlug}${path}${redirectQuery}`;
  }, [domain, merchantSlug, path]);

  // Cache WebView source globally to prevent tab switching reloads!
  const source = useMemo(() => ({ uri: targetUrl }), [targetUrl]);

  // Custom User-Agent to tell the web panel we are in the mobile app shell
  const customUserAgent = Platform.select({
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ShopiatorsMerchantApp/1.0',
    android: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 ShopiatorsMerchantApp/1.0',
  });

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior (exiting app)
      }
      return false; // Let Expo Router handle it
    };

    let subscription: any = null;
    if (Platform.OS === 'android') {
      subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }
    return () => {
      if (Platform.OS === 'android' && subscription) {
        subscription.remove();
      }
    };
  }, [canGoBack]);

  // JS script to inject for advanced pull-to-refresh coordinate bridge
  const scrollBridgeScript = `
    (function() {
      // Listen to scroll events on web page
      window.addEventListener('scroll', function() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'scroll',
          scrollTop: scrollTop
        }));
      });

      // Also listen to double taps or custom events if needed
      document.body.style.webkitUserSelect = 'none'; // prevent text selections
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const messageString = event.nativeEvent.data;
      
      // Parse with AppBridge first
      appBridge.handleMessage(messageString).then((handled) => {
        if (handled) return;

        // Fallback for coordinate/scroll logic
        try {
          const data = JSON.parse(messageString);
          if (data.type === 'scroll') {
            setIsScrollAtTop(data.scrollTop <= 5);
          }
        } catch (err) {}
      });
    } catch (e) {
      // Ignore
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;

    if (url.startsWith('about:blank') || url.startsWith('data:')) {
      return true;
    }

    try {
      const hostname = new URL(url).hostname;
      
      const isWhitelisted = 
        hostname === domain || 
        hostname.endsWith('.shopiators.com') ||
        hostname === 'localhost';

      if (isWhitelisted) {
        return true;
      }

      console.log(`[Security] Sandbox gated external navigation: ${url}`);
      appBridge.executeExternalBrowser(url);
      return false;
    } catch (e) {
      return true;
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);
    
    // Check if web page redirected or failed auth
    if (navState.url.includes('/login') || navState.url.includes('/auth/login')) {
      // Token probably expired or invalid, prompt login clear
      console.warn('WebView redirected to login screen, clearing stale credentials.');
      clearSession();
    }
  };

  const handleRefresh = () => {
    if (webViewRef.current) {
      setIsRefreshing(true);
      webViewRef.current.reload();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    bootstrapWebViewSession();
  };

  return (
    <View style={styles.container}>
      {/* Offline/Error State Screen */}
      {hasError ? (
        <Animated.View entering={FadeIn} style={styles.errorContainer}>
          <WifiOffIcon size={48} color="#94a3b8" style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Connection Lost</Text>
          <Text style={styles.errorSubtitle}>
            We couldn't connect to your merchant panel. Please check your internet connection.
          </Text>
          <TouchableOpacity style={styles.retryButton} activeOpacity={0.8} onPress={handleRetry}>
            <RotateCwIcon size={16} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        /* Native ScrollView wrapper for Pull to Refresh */
        <ScrollView
          contentContainerStyle={styles.scrollWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              enabled={isScrollAtTop}
              tintColor="#6366f1"
              colors={['#6366f1']}
              progressBackgroundColor="#1e293b"
            />
          }
        >
          {bootstrapState === 'success' && (
            <WebView
              ref={webViewRef}
              source={source}
              userAgent={customUserAgent}
              style={[styles.webView, isLoading && styles.hidden]}
              onNavigationStateChange={handleNavigationStateChange}
              injectedJavaScript={scrollBridgeScript}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              startInLoadingState={true}
              showsVerticalScrollIndicator={false}
              onError={() => setHasError(true)}
              onHttpError={() => setHasError(true)}
              // Performance boosts for mid-range android devices
              androidLayerType="hardware"
              decelerationRate="normal"
            />
          )}

          {/* Premium Native Skeleton Loading Shimmer (Active during bootstrap or web page load) */}
          {(bootstrapState === 'bootstrapping' || isLoading) && (
            <Animated.View exiting={FadeOut.duration(300)} style={styles.skeletonContainer}>
              <View style={styles.skeletonHeader} />
              <View style={styles.skeletonStatsRow}>
                <View style={styles.skeletonStatCard} />
                <View style={styles.skeletonStatCard} />
              </View>
              <View style={styles.skeletonChartCard} />
              <View style={styles.skeletonListCard}>
                <View style={styles.skeletonRow} />
                <View style={styles.skeletonRow} />
                <View style={styles.skeletonRow} />
              </View>
              <ActivityIndicator color="#6366f1" size="small" style={styles.loaderSpinner} />
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollWrapper: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  loaderSpinner: {
    marginTop: 20,
  },
  // Skeleton Loading styles matching premium Stripe/Shopify look
  skeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#030712',
    padding: 16,
  },
  skeletonHeader: {
    height: 32,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    width: '45%',
    marginBottom: 20,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonStatCard: {
    height: 90,
    backgroundColor: '#111827',
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  skeletonChartCard: {
    height: 180,
    backgroundColor: '#111827',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  skeletonListCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  skeletonRow: {
    height: 16,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    marginBottom: 14,
    width: '90%',
  },
  // Error States styling
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#030712',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  btnIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
