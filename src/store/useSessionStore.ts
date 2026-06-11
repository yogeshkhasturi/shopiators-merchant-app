import { create } from 'zustand';
import { secureStore } from '../services/secure-store';
import * as Linking from 'expo-linking';

let activeRefreshPromise: Promise<boolean> | null = null;
const activeExchanges = new Set<string>();

// Helper to log SecureStore reads (adds debug info for each async call)
const logSecure = async <T>(name: string, fn: () => Promise<T>): Promise<T | null> => {
  try {
    const result = await fn();
    console.log(`[SecureStore] ${name} = ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    console.error(`[SecureStore] ${name} failed:`, e);
    return null;
  }
};

interface SessionState {
  token: string | null;           // Matches access token
  refreshToken: string | null;
  expiresAt: number | null;       // Timestamp (ms) when token expires
  merchantSlug: string | null;
  domain: string;
  merchantMetadata: any | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  pendingPath: string | null;
  initializeSession: () => Promise<void>;
  setSession: (
    token: string,
    refreshToken: string | null,
    expiresAt: number | null,
    merchantSlug: string,
    domain?: string,
    metadata?: any
  ) => Promise<void>;
  exchangeCodeForToken: (code: string, redirectUri?: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshSessionSilent: (rToken: string, activeDomain: string) => Promise<boolean>;
  clearSession: () => Promise<void>;
  setPendingPath: (path: string | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  refreshToken: null,
  expiresAt: null,
  merchantSlug: null,
  domain: 'admin.shopiators.com',
  merchantMetadata: null,
  isAuthenticated: false,
  isSessionLoading: true,
  pendingPath: null,
  // New helper to forcibly stop loading (used for debugging)
  forceStopLoading: () => set({ isSessionLoading: false }),

  setPendingPath: (path: string | null) => set({ pendingPath: path }),

  initializeSession: async () => {
    try {
        const [token, refreshToken, expiresAt, merchantSlug, domain, metadata] = await Promise.all([
          logSecure('token', secureStore.getToken),
          logSecure('refreshToken', secureStore.getRefreshToken),
          logSecure('expiresAt', secureStore.getExpiresAt),
          logSecure('merchantSlug', secureStore.getMerchantSlug),
          logSecure('domain', secureStore.getDomain),
          logSecure('metadata', secureStore.getMetadata),
        ]);

      const activeDomain = domain || 'admin.shopiators.com';

      // Silent refresh check if access token is expired or expiring within 5 minutes (300,000 ms)
      if (token && refreshToken && expiresAt && Date.now() + 300000 >= expiresAt) {
        console.log('[Auth] Access token is near expiration or expired. Attempting silent token refresh.');
        
        // Temporarily set loading state to avoid flash of content
        set({ isSessionLoading: true });
        
        // Attempt silent refresh
        const refreshed = await get().refreshSessionSilent(refreshToken, activeDomain);
        if (refreshed) {
          set({ isSessionLoading: false });
          console.log('[Auth] Silent token refresh succeeded during initialization.');
          return;
        } else {
          console.warn('[Auth] Silent token refresh failed during initialization. Clearing session.');
          await secureStore.clearAll();
          set({
            token: null,
            refreshToken: null,
            expiresAt: null,
            merchantSlug: null,
            domain: 'admin.shopiators.com',
            merchantMetadata: null,
            isAuthenticated: false,
            isSessionLoading: false,
          });
          return;
        }
      }

      set({
        token,
        refreshToken,
        expiresAt,
        merchantSlug,
        domain: activeDomain,
        merchantMetadata: metadata,
        isAuthenticated: !!token && !!merchantSlug && (!expiresAt || Date.now() < expiresAt),
        isSessionLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize session store:', error);
      set({ isSessionLoading: false });
    }
  },

  setSession: async (token, refreshToken, expiresAt, merchantSlug, domain = 'admin.shopiators.com', metadata = null) => {
    try {
      await Promise.all([
        secureStore.saveToken(token),
        refreshToken ? secureStore.saveRefreshToken(refreshToken) : Promise.resolve(),
        expiresAt ? secureStore.saveExpiresAt(expiresAt) : Promise.resolve(),
        secureStore.saveMerchantSlug(merchantSlug),
        secureStore.saveDomain(domain),
        metadata ? secureStore.saveMetadata(metadata) : Promise.resolve(),
      ]);

      set({
        token,
        refreshToken: refreshToken || get().refreshToken,
        expiresAt: expiresAt || get().expiresAt,
        merchantSlug,
        domain,
        merchantMetadata: metadata || get().merchantMetadata,
        isAuthenticated: !!token,
        isSessionLoading: false,
      });
    } catch (error) {
      console.error('Failed to set session:', error);
    }
  },

  exchangeCodeForToken: async (code: string, redirectUri?: string) => {
    if (activeExchanges.has(code)) {
      console.log('[Auth] Code is already being exchanged, ignoring duplicate request:', code);
      return;
    }
    activeExchanges.add(code);
    set({ isSessionLoading: true });
    try {
      console.log('[Auth] Initiating token exchange for authorization code...');
      const resolvedRedirectUri = redirectUri || 'shopiators://auth/callback';
      console.log('[Auth] Using redirect_uri for token exchange:', resolvedRedirectUri);

      const response = await fetch('https://auth.shopiators.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: 'merchant_app',
          redirect_uri: resolvedRedirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('[Auth] Token exchange succeeded.');

      const token = data.access_token;
      const refreshToken = data.refresh_token || null;
      const expiresIn = data.expires_in || 3600; // default 1 hour if not provided
      const expiresAt = Date.now() + expiresIn * 1000;
      const merchantSlug = data.merchant_slug;
      const domain = data.domain || 'admin.shopiators.com';
      const metadata = data.metadata || null;

      if (!token || !merchantSlug) {
        throw new Error('Token exchange response did not contain access_token or merchant_slug.');
      }

      await get().setSession(token, refreshToken, expiresAt, merchantSlug, domain, metadata);
    } catch (error) {
      console.error('[Auth] OAuth Token Exchange Error:', error);
      set({ isSessionLoading: false });
      throw error;
    } finally {
      activeExchanges.delete(code);
    }
  },

  refreshSession: async (): Promise<boolean> => {
    const { refreshToken, domain } = get();
    if (!refreshToken) {
      console.warn('[Auth] Cannot refresh session: no refresh token available.');
      await get().clearSession();
      return false;
    }
    return get().refreshSessionSilent(refreshToken, domain);
  },

  // Internal silent refresh runner
  refreshSessionSilent: async (rToken: string, activeDomain: string): Promise<boolean> => {
    if (activeRefreshPromise) {
      console.log('[Auth] Silent token refresh is already in progress. Re-using active promise.');
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      try {
        console.log('[Auth] Refreshing OAuth session token silently...');
        const response = await fetch('https://auth.shopiators.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: rToken,
            client_id: 'merchant_app',
          }),
        });

        if (!response.ok) {
          console.warn(`[Auth] Refresh token endpoint returned status ${response.status}`);
          return false;
        }

        const data = await response.json();
        const token = data.access_token;
        const newRefreshToken = data.refresh_token || rToken; // reuse old if same
        const expiresIn = data.expires_in || 3600;
        const expiresAt = Date.now() + expiresIn * 1000;
        const merchantSlug = data.merchant_slug || get().merchantSlug;
        const domain = data.domain || activeDomain;
        const metadata = data.metadata || get().merchantMetadata;

        if (!token || !merchantSlug) {
          return false;
        }

        await get().setSession(token, newRefreshToken, expiresAt, merchantSlug, domain, metadata);
        console.log('[Auth] Silent token refresh succeeded.');
        return true;
      } catch (error) {
        console.error('[Auth] Silent token refresh encountered an error:', error);
        return false;
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  },

  clearSession: async () => {
    try {
      console.log('[Auth] Disconnecting session. Clearing all secure stored credentials...');
      await secureStore.clearAll();
      set({
        token: null,
        refreshToken: null,
        expiresAt: null,
        merchantSlug: null,
        domain: 'admin.shopiators.com',
        merchantMetadata: null,
        isAuthenticated: false,
        isSessionLoading: false,
      });
    } catch (error) {
      console.error('Failed to clear session store', error);
    }
  },
}));
