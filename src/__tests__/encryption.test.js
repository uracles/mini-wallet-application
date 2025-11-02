import { encrypt, decrypt, hash, generateToken } from '../utils/encryption.js';

describe('Encryption Utility', () => {
  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt text correctly', () => {
      const originalText = 'This is a secret message';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    test('should produce different encrypted values for same input', () => {
      const text = 'Same input';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    test('should handle empty strings', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe('');
    });

    test('should handle long strings', () => {
      const longText = 'a'.repeat(10000);
      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(longText);
    });

    test('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?[];\',./`~';
      const encrypted = encrypt(specialText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(specialText);
    });

    test('should throw error on invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow();
    });
  });

  describe('hash', () => {
    test('should produce consistent hash for same input', () => {
      const input = 'password123';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different inputs', () => {
      const hash1 = hash('password1');
      const hash2 = hash('password2');
      
      expect(hash1).not.toBe(hash2);
    });

    test('should produce 64-character hex string', () => {
      const result = hash('test');
      
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateToken', () => {
    test('should generate token of correct length', () => {
      const token = generateToken(32);
      
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    test('should generate different tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
    });

    test('should generate hex string', () => {
      const token = generateToken();
      
      expect(token).toMatch(/^[a-f0-9]+$/);
    });
  });
});
