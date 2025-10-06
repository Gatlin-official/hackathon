// Data encryption utilities for privacy protection
// Uses Web Crypto API for client-side encryption

export class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  /**
   * Generate a cryptographic key for encryption/decryption
   */
  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static async encryptData(data: string, key: CryptoKey): Promise<{
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
  }> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      dataBuffer
    );
    
    return { encryptedData, iv };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static async decryptData(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Export key to store securely (for user's local storage)
   */
  static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await window.crypto.subtle.exportKey('raw', key);
  }

  /**
   * Import key from stored data
   */
  static async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.ALGORITHM },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to Base64 string for storage
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string back to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Pseudonym generator for identity protection
export class PseudonymGenerator {
  private static readonly ADJECTIVES = [
    'Swift', 'Bright', 'Silent', 'Brave', 'Calm', 'Bold', 'Pure', 'Wise',
    'Noble', 'Quick', 'Sharp', 'Clear', 'Strong', 'Gentle', 'Free', 'Wild',
    'Mystic', 'Golden', 'Silver', 'Crystal', 'Shadow', 'Light', 'Storm', 'Wind'
  ];

  private static readonly NOUNS = [
    'Eagle', 'Wolf', 'Phoenix', 'Tiger', 'Dragon', 'Lion', 'Hawk', 'Fox',
    'Owl', 'Bear', 'Falcon', 'Raven', 'Panther', 'Dolphin', 'Whale', 'Shark',
    'Mountain', 'Ocean', 'Star', 'Moon', 'Sun', 'River', 'Forest', 'Thunder'
  ];

  /**
   * Generate a random pseudonym
   */
  static generate(): string {
    const adjective = this.ADJECTIVES[Math.floor(Math.random() * this.ADJECTIVES.length)];
    const noun = this.NOUNS[Math.floor(Math.random() * this.NOUNS.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${adjective}${noun}${number}`;
  }

  /**
   * Generate a deterministic pseudonym from user data (consistent but private)
   */
  static generateFromSeed(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const adjIndex = Math.abs(hash) % this.ADJECTIVES.length;
    const nounIndex = Math.abs(hash >> 16) % this.NOUNS.length;
    const number = (Math.abs(hash) % 999) + 1;
    
    return `${this.ADJECTIVES[adjIndex]}${this.NOUNS[nounIndex]}${number}`;
  }
}

// Secure local storage with encryption
export class SecureStorage {
  private static userKey: CryptoKey | null = null;

  /**
   * Initialize secure storage for user
   */
  static async initialize(userEmail: string): Promise<void> {
    const keyName = `encryption_key_${btoa(userEmail)}`;
    const storedKey = localStorage.getItem(keyName);
    
    if (storedKey) {
      // Import existing key
      const keyBuffer = DataEncryption.base64ToArrayBuffer(storedKey);
      this.userKey = await DataEncryption.importKey(keyBuffer);
    } else {
      // Generate new key
      this.userKey = await DataEncryption.generateKey();
      const exportedKey = await DataEncryption.exportKey(this.userKey);
      const base64Key = DataEncryption.arrayBufferToBase64(exportedKey);
      localStorage.setItem(keyName, base64Key);
    }
  }

  /**
   * Securely store encrypted data
   */
  static async setItem(key: string, value: string): Promise<void> {
    if (!this.userKey) {
      throw new Error('Secure storage not initialized');
    }
    
    const { encryptedData, iv } = await DataEncryption.encryptData(value, this.userKey);
    
    const storageData = {
      data: DataEncryption.arrayBufferToBase64(encryptedData),
      iv: DataEncryption.arrayBufferToBase64(iv.buffer as ArrayBuffer),
      timestamp: Date.now()
    };
    
    localStorage.setItem(`secure_${key}`, JSON.stringify(storageData));
  }

  /**
   * Retrieve and decrypt data
   */
  static async getItem(key: string): Promise<string | null> {
    if (!this.userKey) {
      throw new Error('Secure storage not initialized');
    }
    
    const storedData = localStorage.getItem(`secure_${key}`);
    if (!storedData) return null;
    
    try {
      const parsedData = JSON.parse(storedData);
      const encryptedBuffer = DataEncryption.base64ToArrayBuffer(parsedData.data);
      const ivBuffer = new Uint8Array(DataEncryption.base64ToArrayBuffer(parsedData.iv));
      
      return await DataEncryption.decryptData(encryptedBuffer, this.userKey, ivBuffer);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  /**
   * Remove encrypted item
   */
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  /**
   * Clear all user's encrypted data
   */
  static clearUserData(userEmail: string): void {
    const keyName = `encryption_key_${btoa(userEmail)}`;
    localStorage.removeItem(keyName);
    
    // Remove all secure items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    }
    
    this.userKey = null;
  }
}

// Privacy-compliant data manager
export class PrivacyDataManager {
  /**
   * Hash sensitive data for privacy
   */
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    return DataEncryption.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Anonymize user data for analytics
   */
  static anonymizeUserData(userData: any): any {
    const anonymized = { ...userData };
    
    // Remove or hash personally identifiable information
    delete anonymized.email;
    delete anonymized.name;
    delete anonymized.userId;
    
    // Replace with anonymized identifiers
    if (userData.email) {
      anonymized.userHash = this.hashData(userData.email);
    }
    
    return anonymized;
  }

  /**
   * Prepare data export for user (GDPR compliance)
   */
  static async exportUserData(userEmail: string): Promise<any> {
    const exportData = {
      exportDate: new Date().toISOString(),
      userEmail: userEmail,
      encryptedData: {} as Record<string, string>,
      metadata: {
        totalMessages: 0,
        groupMemberships: 0,
        stressAnalyses: 0
      }
    };

    // Collect all secure data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        const decryptedValue = await SecureStorage.getItem(key.replace('secure_', ''));
        if (decryptedValue) {
          exportData.encryptedData[key] = decryptedValue;
        }
      }
    }

    return exportData;
  }

  /**
   * Generate privacy report
   */
  static generatePrivacyReport(): {
    encryptionStatus: string;
    dataCategories: string[];
    retentionPolicy: string;
    userRights: string[];
  } {
    return {
      encryptionStatus: 'AES-256-GCM encryption active',
      dataCategories: [
        'Chat messages (encrypted)',
        'User preferences (encrypted)',
        'Stress analysis data (encrypted)',
        'Group memberships (encrypted)'
      ],
      retentionPolicy: 'Data stored locally with user-controlled encryption keys',
      userRights: [
        'Right to access your data',
        'Right to rectify incorrect data',
        'Right to erase all data',
        'Right to data portability',
        'Right to object to processing'
      ]
    };
  }
}