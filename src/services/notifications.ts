import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure standard foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request device permission for push notification delivery
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    // Push notifications are only supported on physical devices
    if (!Device.isDevice) {
      console.warn('[NotificationService] Push notifications must be tested on a physical device.');
      return 'mock-push-token-simulator';
    }

    try {
      // 1. Setup Android channel specifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#818cf8',
        });
      }

      // 2. Fetch and request push permission states
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[NotificationService] Failed to obtain push permission.');
        return null;
      }

      // 3. Fetch the Expo Push Token dynamically
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 'dummy-project-id';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      console.log('[NotificationService] Push token successfully generated:', token);
      return token;
    } catch (e) {
      console.error('[NotificationService] Error registering push notifications:', e);
      return null;
    }
  },

  /**
   * Set up push notification click listeners to handle deep link routing into WebViews
   */
  setupNotificationListeners(router: ReturnType<typeof useRouter>) {
    if (Platform.OS === 'web') return () => {};

    // Helper to resolve navigation to the generic WebView
    const handleNotificationClick = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (data && data.path) {
        console.log('[NotificationService] Processing clicked notification deep link path:', data.path);
        
        // Deep link immediately to appropriate WebView path
        router.push({
          pathname: '/webview-screen',
          params: { 
            path: data.path as string, 
            title: (data.title as string) || 'Alert' 
          }
        });
      }
    };

    // 1. Listen for notification clicks when app is in background/foreground
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationClick);

    // 2. Cold-start check: If app was completely closed and launched via notification click
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('[NotificationService] Detected cold-start launch via push click.');
        handleNotificationClick(response);
      }
    });

    return () => {
      subscription.remove();
    };
  }
};
