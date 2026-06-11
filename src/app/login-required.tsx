import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  Modal
} from 'react-native';
import { useSessionStore } from '../store/useSessionStore';
import { Smartphone, Laptop, ArrowRight, Sparkles, LogIn, Globe, QrCode } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { appBridge } from '../services/app-bridge';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { decodeSessionToken } from '../utils/jwt';

// Pre-warm the secure browser session for seamless load speeds
WebBrowser.maybeCompleteAuthSession();

const SmartphoneIcon = Smartphone as any;
const LaptopIcon = Laptop as any;
const ArrowRightIcon = ArrowRight as any;
const SparklesIcon = Sparkles as any;
const LogInIcon = LogIn as any;
const GlobeIcon = Globe as any;
const QrCodeIcon = QrCode as any;

export default function LoginRequiredScreen() {
  const exchangeCodeForToken = useSessionStore((state) => state.exchangeCodeForToken);
  const setSession = useSessionStore((state) => state.setSession);
  
  const [storeSlug, setStoreSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  const handleSSOLogin = async () => {
    setErrorMsg(null);
    const slug = storeSlug.trim().toLowerCase();

    if (!slug) {
      setErrorMsg('Please enter your store slug.');
      appBridge.executeHaptic('error');
      return;
    }

    // Validate store slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setErrorMsg('Invalid slug format. Use lowercase letters, numbers, and hyphens.');
      appBridge.executeHaptic('error');
      return;
    }

    setIsLoading(true);
    appBridge.executeHaptic('selection');

    try {
      const redirectUrl = 'shopiators://auth/callback';
      const authUrl = `https://auth.shopiators.com/login?storeSlug=${slug}&type=admin&client=merchant_app&mobile=1&redirect_uri=${encodeURIComponent(redirectUrl)}`;

      console.log(`[SSO] Opening in-app WebView for authentication: ${authUrl}`);
      setWebViewUrl(authUrl);
      setShowWebView(true);
    } catch (err: any) {
      console.error('[SSO] Login process encountered an error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication. Please retry.');
      setIsLoading(false);
      appBridge.executeHaptic('error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Background gradients */}
      <View style={styles.blurTop} />
      <View style={styles.blurBottom} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            
            {/* Brand Header */}
            <Animated.View entering={FadeInUp.delay(100).duration(800)} style={styles.logoContainer}>
              <View style={styles.badgeContainer}>
                <SparklesIcon size={14} color="#a855f7" />
                <Text style={styles.badgeText}>SHOP-OS SSO</Text>
              </View>
              <Text style={styles.brandName}>Shopiators</Text>
              <Text style={styles.brandSubtitle}>Ecommerce Operating System</Text>
            </Animated.View>

            {/* Visual Device Connect Illustration */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.illustration}>
              <View style={styles.deviceBox}>
                <LaptopIcon size={38} color="#64748b" />
                <Text style={styles.deviceLabel}>Web Portal</Text>
              </View>
              
              <View style={styles.connectorLine}>
                <View style={styles.connectorDot} />
                <ArrowRightIcon size={16} color="#818cf8" />
                <View style={styles.connectorDot} />
              </View>

              <View style={[styles.deviceBox, styles.deviceBoxActive]}>
                <SmartphoneIcon size={38} color="#818cf8" />
                <Text style={[styles.deviceLabel, styles.deviceLabelActive]}>Mobile App</Text>
              </View>
            </Animated.View>

            {/* Action Card with Store Input */}
            <Animated.View entering={FadeInDown.delay(350).duration(800)} style={styles.loginCard}>
              <Text style={styles.cardHeaderTitle}>Connect Merchant Store</Text>
              <Text style={styles.cardSubTitle}>
                Enter your unique store slug below to launch the Single Sign-On broker.
              </Text>

              {/* Slug Input Wrapper */}
              <View style={styles.inputContainer}>
                <GlobeIcon size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="store-slug"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={storeSlug}
                  onChangeText={(text) => {
                    setStoreSlug(text);
                    setErrorMsg(null);
                  }}
                  editable={!isLoading}
                />
                <Text style={styles.domainPostfix}>.shopiators.com</Text>
              </View>

              {/* Validation Errors */}
              {errorMsg && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}

              {/* Action Buttons */}
              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                activeOpacity={0.8}
                onPress={handleSSOLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <LogInIcon size={18} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>Sign In with SSO</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* QR Connection Tip Card */}
            <Animated.View entering={FadeInDown.delay(420).duration(800)} style={styles.qrTipCard}>
              <View style={styles.qrTipHeader}>
                <QrCodeIcon size={16} color="#818cf8" style={{ marginRight: 6 }} />
                <Text style={styles.qrTipTitle}>Quick Connect with QR Code</Text>
              </View>
              <Text style={styles.qrTipDescription}>
                Click "Connect Mobile App" in your Desktop Admin panel, then scan the generated QR code using your phone's native camera app to sign in instantly.
              </Text>
            </Animated.View>

            {/* Step Guides */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.stepFooter}>
              <Text style={styles.footerNote}>
                Shopiators secure centralized SSO keeps your customer and merchant sessions unified without repeating passwords on this device.
              </Text>
            </Animated.View>
            
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* SSO Webview Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowWebView(false);
          setIsLoading(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#030712' }}>
          <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#1f2937', backgroundColor: '#0b0f19' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>SSO Sign In</Text>
            <TouchableOpacity onPress={() => { setShowWebView(false); setIsLoading(false); }}>
              <Text style={{ color: '#cbd5e1', fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: webViewUrl }}
            userAgent={Platform.select({
              ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ShopiatorsMerchantApp/1.0',
              android: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 ShopiatorsMerchantApp/1.0',
            })}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              console.log('[LoginWebView] Navigating to:', url);
              if (url.startsWith('shopiators://auth/callback') || url.includes('token=') || url.includes('code=')) {
                const parsed = Linking.parse(url);
                const token = parsed.queryParams?.token as string;
                const code = parsed.queryParams?.code as string;

                if (token) {
                  console.log('[LoginWebView] Found token directly in callback URL, setting session...');
                  setShowWebView(false);

                  let expiresAt: number | null = null;
                  let storeSlugDecoded = storeSlug;
                  let userObj = null;

                  try {
                    const decoded = decodeSessionToken(token);
                    if (decoded) {
                      if (decoded.exp) {
                        expiresAt = decoded.exp * 1000;
                      }
                      if (decoded.storeSlug) {
                        storeSlugDecoded = decoded.storeSlug;
                      }
                    }
                  } catch (e) {
                    console.error('[LoginWebView] Failed to decode token:', e);
                  }

                  try {
                    if (parsed.queryParams?.user) {
                      userObj = JSON.parse(decodeURIComponent(parsed.queryParams.user as string));
                    }
                  } catch (e) {}

                  setSession(token, null, expiresAt, storeSlugDecoded, 'admin.shopiators.com', userObj)
                    .then(() => {
                      appBridge.executeHaptic('success');
                    })
                    .catch((err) => {
                      console.error('[LoginWebView] Setting session failed:', err);
                      setErrorMsg(err.message || 'Failed to set session.');
                      setIsLoading(false);
                    });

                  return false;
                }

                if (code) {
                  console.log('[LoginWebView] Found authorization code, exchanging...');
                  setShowWebView(false);
                  exchangeCodeForToken(code, 'shopiators://auth/callback')
                    .then(() => {
                      appBridge.executeHaptic('success');
                    })
                    .catch((err) => {
                      console.error('[LoginWebView] Exchange failed:', err);
                      setErrorMsg(err.message || 'Token exchange failed.');
                      setIsLoading(false);
                    });
                  return false;
                }
              }
              return true;
            }}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  blurTop: {
    position: 'absolute',
    top: -80,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    filter: 'blur(70px)',
  },
  blurBottom: {
    position: 'absolute',
    bottom: -80,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    filter: 'blur(70px)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  badgeText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginLeft: 5,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  illustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.25)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    width: '100%',
  },
  deviceBox: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deviceBoxActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  deviceLabel: {
    fontSize: 10,
    color: '#475569',
    marginTop: 6,
    fontWeight: '600',
  },
  deviceLabelActive: {
    color: '#818cf8',
  },
  connectorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  connectorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1e293b',
    marginHorizontal: 3,
  },
  loginCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubTitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0, // fix android padding defaults
  },
  domainPostfix: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#3b3d91',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  stepFooter: {
    width: '100%',
    paddingHorizontal: 16,
  },
  footerNote: {
    fontSize: 10.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
  qrTipCard: {
    width: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    marginTop: 16,
  },
  qrTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  qrTipTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#818cf8',
  },
  qrTipDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
});
