import * as SecureStore from 'expo-secure-store';

const KEY_TOKEN = 'shopiators_auth_token';
const KEY_REFRESH_TOKEN = 'shopiators_refresh_token';
const KEY_EXPIRES_AT = 'shopiators_expires_at';
const KEY_MERCHANT = 'shopiators_merchant_slug';
const KEY_DOMAIN = 'shopiators_auth_domain';
const KEY_METADATA = 'shopiators_merchant_metadata';

export const secureStore = {
  // Access Token
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token to secure store', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_TOKEN);
    } catch (error) {
      console.error('Error getting auth token from secure store', error);
      return null;
    }
  },

  async deleteToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_TOKEN);
    } catch (error) {
      console.error('Error deleting auth token from secure store', error);
    }
  },

  // Refresh Token
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error saving refresh token to secure store', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token from secure store', error);
      return null;
    }
  },

  async deleteRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
    } catch (error) {
      console.error('Error deleting refresh token from secure store', error);
    }
  },

  // Expiration Timestamp (epoch ms string)
  async saveExpiresAt(timestampMs: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_EXPIRES_AT, String(timestampMs));
    } catch (error) {
      console.error('Error saving expiration timestamp to secure store', error);
    }
  },

  async getExpiresAt(): Promise<number | null> {
    try {
      const val = await SecureStore.getItemAsync(KEY_EXPIRES_AT);
      return val ? parseInt(val, 10) : null;
    } catch (error) {
      console.error('Error getting expiration timestamp from secure store', error);
      return null;
    }
  },

  async deleteExpiresAt(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_EXPIRES_AT);
    } catch (error) {
      console.error('Error deleting expiration timestamp from secure store', error);
    }
  },

  // Merchant Slug
  async saveMerchantSlug(slug: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_MERCHANT, slug);
    } catch (error) {
      console.error('Error saving merchant slug to secure store', error);
    }
  },

  async getMerchantSlug(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_MERCHANT);
    } catch (error) {
      console.error('Error getting merchant slug from secure store', error);
      return null;
    }
  },

  async deleteMerchantSlug(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_MERCHANT);
    } catch (error) {
      console.error('Error deleting merchant slug from secure store', error);
    }
  },

  // Domain Configuration
  async saveDomain(domain: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_DOMAIN, domain);
    } catch (error) {
      console.error('Error saving domain to secure store', error);
    }
  },

  async getDomain(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_DOMAIN);
    } catch (error) {
      console.error('Error getting domain from secure store', error);
      return null;
    }
  },

  async deleteDomain(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_DOMAIN);
    } catch (error) {
      console.error('Error deleting domain from secure store', error);
    }
  },

  // Metadata JSON
  async saveMetadata(metadata: any): Promise<void> {
    try {
      const str = JSON.stringify(metadata);
      await SecureStore.setItemAsync(KEY_METADATA, str);
    } catch (error) {
      console.error('Error saving metadata to secure store', error);
    }
  },

  async getMetadata(): Promise<any | null> {
    try {
      const str = await SecureStore.getItemAsync(KEY_METADATA);
      return str ? JSON.parse(str) : null;
    } catch (error) {
      console.error('Error getting metadata from secure store', error);
      return null;
    }
  },

  async deleteMetadata(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_METADATA);
    } catch (error) {
      console.error('Error deleting metadata from secure store', error);
    }
  },

  // Full clear
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEY_TOKEN),
        SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
        SecureStore.deleteItemAsync(KEY_MERCHANT),
        SecureStore.deleteItemAsync(KEY_DOMAIN),
        SecureStore.deleteItemAsync(KEY_METADATA),
      ]);
    } catch (error) {
      console.error('Error clearing secure store credentials', error);
    }
  },
};
