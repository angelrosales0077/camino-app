/**
 * @camino/mobile - Secure Storage Utilities
 */

import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  /**
   * Set a secure value in storage
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error(`Failed to set secure value for key: ${key}`, error)
      throw error
    }
  },

  /**
   * Get a secure value from storage
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key)
      return value || null
    } catch (error) {
      console.error(`Failed to get secure value for key: ${key}`, error)
      return null
    }
  },

  /**
   * Remove a secure value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error(`Failed to remove secure value for key: ${key}`, error)
      throw error
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  },

  /**
   * Clear all stored values
   */
  async clear(): Promise<void> {
    const keys = [
      'auth_token',
      'auth_refresh_token',
      'encryption_key',
      'user_id',
      'user_email',
    ]
    try {
      await Promise.all(keys.map((key) => this.remove(key)))
    } catch (error) {
      console.error('Failed to clear secure storage', error)
      throw error
    }
  },
}

// Authentication token storage
export const authStorage = {
  async setAccessToken(token: string): Promise<void> {
    return secureStorage.set('auth_token', token)
  },

  async getAccessToken(): Promise<string | null> {
    return secureStorage.get('auth_token')
  },

  async setRefreshToken(token: string): Promise<void> {
    return secureStorage.set('auth_refresh_token', token)
  },

  async getRefreshToken(): Promise<string | null> {
    return secureStorage.get('auth_refresh_token')
  },

  async clearAuthTokens(): Promise<void> {
    await Promise.all([
      secureStorage.remove('auth_token'),
      secureStorage.remove('auth_refresh_token'),
      secureStorage.remove('user_id'),
      secureStorage.remove('user_email'),
    ])
  },

  async setUserId(userId: string): Promise<void> {
    return secureStorage.set('user_id', userId)
  },

  async getUserId(): Promise<string | null> {
    return secureStorage.get('user_id')
  },

  async setUserEmail(email: string): Promise<void> {
    return secureStorage.set('user_email', email)
  },

  async getUserEmail(): Promise<string | null> {
    return secureStorage.get('user_email')
  },
}

// Encryption key storage
export const cryptoStorage = {
  async setEncryptionKey(key: string): Promise<void> {
    return secureStorage.set('encryption_key', key)
  },

  async getEncryptionKey(): Promise<string | null> {
    return secureStorage.get('encryption_key')
  },

  async hasEncryptionKey(): Promise<boolean> {
    return secureStorage.exists('encryption_key')
  },

  async clearEncryptionKey(): Promise<void> {
    return secureStorage.remove('encryption_key')
  },
}
