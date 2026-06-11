import React, { useRef, useState, useEffect, useMemo } from 'react';
import { BottomTabInset } from '../constants/theme';
import { StyleSheet, View, ActivityIndicator, BackHandler, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSessionStore } from '../store/useSessionStore';
import { AlertCircle, RotateCw, WifiOff } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { appBridge } from '../services/app-bridge';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

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

  // Scope checker to ensure each WebView only handles paths belonging to its own tab
  const isPathInScope = (currentTabPath: string, targetPath: string): boolean => {
    const targetTab = getTabRouteForWebPath(targetPath);
    const currentTab = getTabRouteForWebPath(currentTabPath);
    return targetTab !== null && targetTab === currentTab;
  };

  // Handle cross-tab web path navigation events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('navigate-web-path', (webPath: string) => {
      if (!isPathInScope(path, webPath)) {
        return; // Skip if this target URL is not in this tab's scope
      }
      console.log('[WebView] Navigating scoped tab to path:', webPath);
      if (webViewRef.current) {
        const separator = webPath.includes('?') ? '&' : '?';
        const url = `https://${domain}/${merchantSlug}${webPath}${separator}mobile_app=1`;
        webViewRef.current.injectJavaScript(`window.location.href = '${url}';`);
      }
    });
    return () => subscription.remove();
  }, [domain, merchantSlug, path]);

  // Handle opening the website's built-in notification drawer/dropdown programmatically
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('trigger-web-notification', () => {
      console.log('[WebView] Native bell pressed. Programmatically triggering web notification bell click event...');
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            var bellSelectors = [
              '[class*="bell"]',
              '[id*="bell"]',
              '[class*="notification"]',
              '[id*="notification"]',
              'button:has(svg)',
              'a:has(svg)'
            ];
            
            var bell = null;
            for (var i = 0; i < bellSelectors.length; i++) {
              var el = document.querySelector(bellSelectors[i]);
              if (el) {
                var html = el.innerHTML.toLowerCase();
                if (html.includes('bell') || html.includes('notification')) {
                  bell = el;
                  break;
                }
              }
            }
            
            if (!bell) {
              var svgs = document.getElementsByTagName('svg');
              for (var j = 0; j < svgs.length; j++) {
                var svg = svgs[j];
                if (svg.innerHTML.toLowerCase().includes('bell') || (svg.className && svg.className.baseVal && svg.className.baseVal.includes('bell'))) {
                  var curr = svg;
                  while (curr && curr !== document.body) {
                    if (curr.tagName === 'BUTTON' || curr.tagName === 'A' || curr.onclick) {
                      bell = curr;
                      break;
                    }
                    curr = curr.parentElement;
                  }
                  if (bell) break;
                }
              }
            }
            
            if (bell) {
              console.log('Successfully triggered click on web notification bell.');
              bell.click();
            } else {
              console.log('Web notification bell not found in DOM.');
            }
          })();
          true;
        `);
      }
    });
    return () => subscription.remove();
  }, [domain, merchantSlug]);

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

  // JS script to inject for advanced pull-to-refresh coordinate bridge and CSS hiding
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

      // Inject CSS style to hide header/navbar/footer/sidebar on website to prevent double headers
      // But KEEP notification drawers/dropdowns visible by overriding them to display: block/flex
      var style = document.createElement('style');
      style.innerHTML = 'header, .header, #header, nav, .navbar, .nav, .topbar, #topbar, .site-header, .admin-header, .admin-sidebar, #admin-sidebar, .sidebar, #sidebar, footer, .footer, #footer, .site-footer { display: none !important; } [class*="notification-drawer"], [class*="notification-dropdown"], [class*="notification-panel"], [class*="NotificationDropdown"], [class*="NotificationDrawer"], [class*="in-app-notification"], [class*="notifications"] { display: block !important; visibility: visible !important; opacity: 1 !important; } body { padding-top: 0 !important; margin-top: 0 !important; padding-left: 16px !important; padding-right: 16px !important; box-sizing: border-box !important; background-color: #f6f8fa !important; } #main, .main, #content, .content, main, .wrapper, .main-wrapper, .page-wrapper, .admin-wrapper, .dashboard-wrapper, .app-content, .layout, .layout-content, .container-fluid, .container { margin-left: 0 !important; padding-left: 0 !important; margin-right: 0 !important; padding-right: 0 !important; margin-top: 0 !important; padding-top: 0 !important; width: 100% !important; max-width: 100% !important; } .sticky, [class*="sticky"], [class*="top-["], [class*="top-[81px]"] { top: 0px !important; }';
      document.head.appendChild(style);

      // Clean up large top padding/margin spacers from layout wrappers to eliminate gaps
      function cleanTopGaps() {
        var tagNames = ['div', 'section', 'main', 'article'];
        for (var t = 0; t < tagNames.length; t++) {
          var els = document.getElementsByTagName(tagNames[t]);
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.tagName === 'BODY' || el.tagName === 'HTML') continue;
            
            // 1. Detect and hide empty layout spacer elements at the very top of the page
            var rect = el.getBoundingClientRect();
            if (rect.top === 0 && el.offsetHeight >= 60 && el.offsetHeight <= 100 && el.textContent.trim() === '') {
              el.style.setProperty('display', 'none', 'important');
              continue;
            }

            // 2. Clear explicit margin/padding top spacers
            var styleObj = window.getComputedStyle(el);
            var pTop = parseInt(styleObj.paddingTop, 10);
            var mTop = parseInt(styleObj.marginTop, 10);
            
            if (pTop >= 40 && pTop <= 150) {
              el.style.setProperty('padding-top', '0px', 'important');
            }
            if (mTop >= 40 && mTop <= 150) {
              el.style.setProperty('margin-top', '0px', 'important');
            }
          }
        }
      }

      // Run immediately and periodically for SPA route changes
      cleanTopGaps();
      setInterval(cleanTopGaps, 800);

      // Real-time unread notification count badge observer
      function updateNotificationBadge() {
        var badge = document.querySelector('[class*="count"], [class*="badge"], .notification-count');
        if (badge) {
          var count = parseInt(badge.textContent, 10);
          if (!isNaN(count)) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'notification_count',
              count: count
            }));
          }
        }
      }
      setInterval(updateNotificationBadge, 3000);

      // Real-time DOM toast notifications observer (MutationObserver)
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              var isToast = false;
              var text = node.textContent || '';
              
              var className = node.className || '';
              if (typeof className === 'string') {
                var lowerClass = className.toLowerCase();
                if (lowerClass.includes('toast') || lowerClass.includes('notification') || lowerClass.includes('alert')) {
                  isToast = true;
                }
              }
              
              var role = node.getAttribute('role');
              if (role === 'alert' || role === 'status') {
                isToast = true;
              }
              
              if (isToast && text.trim().length > 0) {
                var lowerText = text.toLowerCase();
                if (lowerText.includes('order') || lowerText.includes('new') || lowerText.includes('received') || lowerText.includes('placed')) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'order_toast',
                    text: text.trim()
                  }));
                }
              }
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });

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
          } else if (data.type === 'notification_count') {
            DeviceEventEmitter.emit('update-notification-count', data.count);
          } else if (data.type === 'order_toast') {
            console.log('[Notification] Received order toast from webview:', data.text);
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Order Alert',
                body: data.text,
                data: { path: '/admin/orders' },
                sound: true,
              },
              trigger: null,
            }).catch((err) => console.error('Failed to trigger local notification:', err));
          } else if (data.type === 'debug_gap') {
            console.log('[DEBUG_GAP] Found pushing element:', data.tag, 'id:', data.id, 'class:', data.className, 'paddingTop:', data.pTop, 'marginTop:', data.mTop, 'top:', data.top);
          } else if (data.type === 'debug_hierarchy') {
            console.log('[DEBUG_HIERARCHY] Path to header:', JSON.stringify(data.path, null, 2));
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
        // Parse the admin path to see if we should trigger a tab switch
        let adminPath = '';
        try {
          const urlObj = new URL(url);
          adminPath = urlObj.pathname;
          if (merchantSlug && adminPath.startsWith(`/${merchantSlug}`)) {
            adminPath = adminPath.substring(merchantSlug.length + 1);
          }
          if (urlObj.search) {
            adminPath += urlObj.search;
          }
        } catch (e) {}

        if (adminPath.startsWith('/admin')) {
          // Skip if it's an authentication or SSO path to allow handshakes to load in-place
          const isAuthPath = 
            adminPath.startsWith('/admin/auth') || 
            adminPath.startsWith('/admin/sso') || 
            adminPath.startsWith('/admin/oauth') ||
            adminPath.startsWith('/admin/login');

          // Detect server-side intermediate redirect pattern: /admin?returnUrl=...
          // This is a normal auth gate redirect — the server will resolve it back to the
          // target page after validating the session cookie. Must NOT be opened in a new
          // webview-screen or it creates an auth loop and logs the user out.
          const isServerRedirectChain = 
            (adminPath === '/admin' || adminPath.startsWith('/admin?')) &&
            (url.includes('returnUrl=') || url.includes('redirect=') || url.includes('next='));

          if (!isAuthPath && !isServerRedirectChain) {
            const tabRoute = getTabRouteForWebPath(adminPath);
            const currentTabRoute = getTabRouteForWebPath(path);

            const isTabWebView = 
              path === '/admin/dashboard' || 
              path === '/admin/orders' || 
              path === '/admin/products' || 
              path === '/admin/customers';

            if (tabRoute) {
              if (tabRoute !== currentTabRoute) {
                console.log(`[WebView Intercept] Switching tab from ${currentTabRoute} to ${tabRoute} for path: ${adminPath}`);
                router.push(tabRoute as any);
                setTimeout(() => {
                  DeviceEventEmitter.emit('navigate-web-path', adminPath);
                }, 150);
                return false;
              }
              // Same tab — let the WebView handle it in-place
              return true;
            } else if (isTabWebView) {
              // Unmapped admin route (e.g. /admin/discounts) — open in overlay webview-screen
              console.log(`[WebView Intercept] Opening unmapped route in webview-screen: ${adminPath}`);
              let title = 'Admin';
              if (adminPath.includes('discounts')) title = 'Discounts';
              else if (adminPath.includes('analytics')) title = 'Analytics';
              else if (adminPath.includes('marketing')) title = 'Marketing';
              else if (adminPath.includes('apps')) title = 'Apps';
              router.push({
                pathname: '/webview-screen',
                params: { path: adminPath, title: title },
              });
              return false;
            }
          }
        }
        return true;
      }

      console.log(`[Security] Sandbox gated external navigation: ${url}`);
      appBridge.executeExternalBrowser(url);
      return false;
    } catch (e) {
      return true;
    }
  };

  const loginRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);

    // Detect if WebView landed on a login/auth page.
    // IMPORTANT: We use a 2-second debounce timer here because the server often does a
    // transient redirect through /login as part of the auth-cookie handshake before
    // immediately redirecting back to the target page. Clearing the session immediately
    // on seeing /login would incorrectly log the user out during normal operation.
    const isOnLoginPage = 
      (navState.url.includes('/login') || navState.url.includes('/auth/login')) &&
      !navState.loading; // Only act when the page has fully settled

    if (isOnLoginPage) {
      if (!loginRedirectTimerRef.current) {
        loginRedirectTimerRef.current = setTimeout(() => {
          // Re-check the current URL after the delay to confirm it's still on login
          // (not just a transient redirect)
          console.warn('[WebView] Session appears expired: still on login page after redirect. Clearing credentials.');
          clearSession();
          loginRedirectTimerRef.current = null;
        }, 2500);
      }
    } else {
      // Navigation moved away from login — cancel any pending logout timer
      if (loginRedirectTimerRef.current) {
        clearTimeout(loginRedirectTimerRef.current);
        loginRedirectTimerRef.current = null;
      }
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
              tintColor="#008060"
              colors={['#008060']}
              progressBackgroundColor="#ffffff"
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
              onError={() => setHasError(true)}
              onHttpError={() => setHasError(true)}
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
              <ActivityIndicator color="#008060" size="small" style={styles.loaderSpinner} />
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
    backgroundColor: '#f6f8fa',
    paddingBottom: BottomTabInset,
  },
  scrollWrapper: {
    flex: 1,
    flexGrow: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#f6f8fa',
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
    backgroundColor: '#f6f8fa',
    padding: 16,
  },
  skeletonHeader: {
    height: 32,
    backgroundColor: '#e2e8f0',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonChartCard: {
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonRow: {
    height: 16,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#f6f8fa',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#5c5f62',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    height: 48,
    backgroundColor: '#008060',
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
