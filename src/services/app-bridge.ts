import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useSessionStore } from '../store/useSessionStore';

export interface BridgeMessage {
  event: string;
  data?: any;
}

export const appBridge = {
  /**
   * Main entry point to parse, validate, and execute messages sent from the embedded WebView.
   * Format: window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'event_name', data: { ... } }))
   */
  async handleMessage(messageString: string): Promise<boolean> {
    try {
      const payload: BridgeMessage = JSON.parse(messageString);
      if (!payload || !payload.event) {
        console.warn('Received empty or invalid bridge message format.');
        return false;
      }

      console.log(`[AppBridge] Executing event: ${payload.event}`, payload.data);

      switch (payload.event) {
        case 'trigger_haptic':
          await this.executeHaptic(payload.data?.type);
          return true;

        case 'open_native_share':
          await this.executeShare(payload.data);
          return true;

        case 'open_external_link':
          await this.executeExternalBrowser(payload.data?.url);
          return true;

        case 'logout':
          await this.executeLogout();
          return true;

        case 'update_badge_count':
          console.log(`[AppBridge] Badge count update requested: ${payload.data?.count}`);
          return true;

        case 'refresh_notifications':
          console.log('[AppBridge] Pulling fresh notification alerts from server.');
          return true;

        default:
          console.warn(`[AppBridge] Unrecognized or unsupported event received: ${payload.event}`);
          return false;
      }
    } catch (e) {
      // Ignore if not a valid JSON structure (e.g. standard postMessages from 3rd party scripts)
      return false;
    }
  },

  /**
   * Action: Trigger physical device vibration sensations standardly
   */
  async executeHaptic(type?: 'success' | 'warning' | 'error' | 'selection') {
    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
        default:
          await Haptics.selectionAsync();
          break;
      }
    } catch (e) {
      console.warn('Failed to trigger haptic feedback:', e);
    }
  },

  /**
   * Action: Open OS-native visual share panel
   */
  async executeShare(data?: { message: string; title?: string; url?: string }) {
    if (!data?.message) return;
    try {
      await Share.share({
        message: data.message,
        title: data.title || 'Shopiators Admin Share',
        url: data.url,
      });
    } catch (e) {
      console.error('Failed to trigger native share sheets:', e);
    }
  },

  /**
   * Action: Load external links securely using a sandboxed web overlay
   */
  async executeExternalBrowser(url?: string) {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#090d16',
        secondaryToolbarColor: '#030712',
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch (e) {
      console.error(`Failed to launch secure external browser overlay for URL: ${url}`, e);
    }
  },

  /**
   * Action: Disconnect device credentials and return user to landing/connect instructions
   */
  async executeLogout() {
    try {
      const clearSession = useSessionStore.getState().clearSession;
      await clearSession();
      await this.executeHaptic('warning');
    } catch (e) {
      console.error('Failed to execute secure logout sequence:', e);
    }
  }
};
