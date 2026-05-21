import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSessionStore } from '../../store/useSessionStore';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { appBridge } from '../../services/app-bridge';

const CheckCircle2Icon = CheckCircle2 as any;
const ShieldCheckIcon = ShieldCheck as any;
const SparklesIcon = Sparkles as any;

export default function ConnectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setSession = useSessionStore((state) => state.setSession);
  const exchangeCodeForToken = useSessionStore((state) => state.exchangeCodeForToken);

  const [status, setStatus] = useState<'reading' | 'authenticating' | 'success' | 'error'>('reading');
  const [errorMessage, setErrorMessage] = useState('');

  const code = params.code as string;
  const token = params.token as string;
  const merchant = params.merchant as string;
  const domain = (params.domain as string) || 'admin.shopiators.com';

  useEffect(() => {
    let active = true;

    async function processAuthentication() {
      // Validate inputs
      if (!code && (!token || !merchant)) {
        setStatus('error');
        setErrorMessage('No connection token or authorization code found. Please trigger login inside the app.');
        return;
      }

      setStatus('authenticating');

      try {
        if (code) {
          console.log('[AuthModal] Exchanging auth code for secure tokens...');
          // Trigger production OAuth code-to-token exchange
          await exchangeCodeForToken(code);
        } else {
          console.log('[AuthModal] Falling back to manual credential set session...');
          // Trigger legacy token setup fallback
          await setSession(token, null, null, merchant, domain);
        }

        if (active) {
          setStatus('success');
          appBridge.executeHaptic('success');

          // Hold success state for UX comfort then navigate into main app
          setTimeout(() => {
            if (active) {
              router.replace('/');
            }
          }, 1200);
        }
      } catch (error: any) {
        console.error('[AuthModal] Processing authentication encountered error:', error);
        if (active) {
          setStatus('error');
          setErrorMessage(
            error.message || 'Failed to establish secure synchronization. Please scan a fresh QR or re-login.'
          );
          appBridge.executeHaptic('error');
        }
      }
    }

    processAuthentication();

    return () => {
      active = false;
    };
  }, [code, token, merchant, domain]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <View style={styles.blurBackground} />

      <View style={styles.content}>
        {status === 'authenticating' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
            <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            <Text style={styles.statusTitle}>Establishing Secure Sync</Text>
            <View style={styles.progressItem}>
              <ShieldCheckIcon size={16} color="#818cf8" style={styles.icon} />
              <Text style={styles.statusSubtitle}>Securing session key...</Text>
            </View>
            <View style={styles.progressItem}>
              <SparklesIcon size={16} color="#a855f7" style={styles.icon} />
              <Text style={styles.statusSubtitle}>
                Syncing {merchant || 'merchant'} store...
              </Text>
            </View>
          </Animated.View>
        )}

        {status === 'success' && (
          <Animated.View entering={ZoomIn.duration(500)} style={styles.card}>
            <View style={styles.successCircle}>
              <CheckCircle2Icon size={48} color="#22c55e" />
            </View>
            <Text style={styles.statusTitle}>Welcome, Founder!</Text>
            <Text style={styles.successSubtitle}>
              Connected securely to {merchant || 'your'} merchant dashboard.
            </Text>
          </Animated.View>
        )}

        {status === 'error' && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Text 
              style={styles.retryButton} 
              onPress={() => router.replace('/login-required')}
            >
              Go Back to Sign In
            </Text>
          </Animated.View>
        )}

        {status === 'reading' && (
          <View style={styles.card}>
            <ActivityIndicator size="small" color="#6366f1" style={styles.loader} />
            <Text style={styles.statusSubtitle}>Parsing connecting token...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    filter: 'blur(70px)',
  },
  content: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  errorCard: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  loader: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  icon: {
    marginRight: 6,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#fca5a5',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  retryButton: {
    fontSize: 14,
    color: '#818cf8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
