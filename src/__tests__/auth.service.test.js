import authService from '../services/auth.service.js';
import { query } from '../config/database.js';

// Mock database
jest.mock('../config/database.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const token = authService.generateToken(1, 'testuser');
      
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include user data in token', () => {
      const userId = 123;
      const username = 'testuser';
      const token = authService.generateToken(userId, username);
      
      const decoded = authService.verifyToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.username).toBe(username);
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const token = authService.generateToken(1, 'testuser');
      const decoded = authService.verifyToken(token);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
    });

    test('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow();
    });

    test('should throw error for malformed token', () => {
      expect(() => authService.verifyToken('not.a.token')).toThrow();
    });
  });

  describe('register', () => {
    test('should register new user successfully', async () => {
      query.mockResolvedValueOnce({ rows: [] }); // No existing user
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'newuser',
          created_at: new Date()
        }]
      });

      const result = await authService.register('newuser', 'Password123!');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('newuser');
      expect(typeof result.token).toBe('string');
    });

    test('should throw error if username already exists', async () => {
      query.mockResolvedValueOnce({ 
        rows: [{ id: 1, username: 'existinguser' }]
      });

      await expect(
        authService.register('existinguser', 'Password123!')
      ).rejects.toThrow('Username already exists');
    });

    test('should hash password before storing', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'newuser',
          created_at: new Date()
        }]
      });

      await authService.register('newuser', 'Password123!');
      
      const insertCall = query.mock.calls[1];
      const passwordHash = insertCall[1][1];
      
      expect(passwordHash).not.toBe('Password123!');
      expect(passwordHash.length).toBeGreaterThan(50); // Bcrypt hashes are long
    });
  });

  describe('login', () => {
    test('should login user with correct credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: '$2b$10$test.hash',
        created_at: new Date()
      };
      
      query.mockResolvedValueOnce({ rows: [mockUser] });
      
      // Mock bcrypt.compare to return true
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.login('testuser', 'Password123!');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
    });

    test('should throw error for non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login('nonexistent', 'Password123!')
      ).rejects.toThrow('Invalid credentials');
    });

    test('should throw error for incorrect password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: '$2b$10$test.hash',
        created_at: new Date()
      };
      
      query.mockResolvedValueOnce({ rows: [mockUser] });
      
      // Mock bcrypt.compare to return false
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        authService.login('testuser', 'WrongPassword123!')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserById', () => {
    test('should return user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: new Date()
      };
      
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.getUserById(1);
      
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.getUserById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    test('should change password with correct old password', async () => {
      const mockUser = {
        password_hash: '$2b$10$test.hash'
      };
      
      query.mockResolvedValueOnce({ rows: [mockUser] });
      query.mockResolvedValueOnce({ rows: [] }); // Update query
      
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.changePassword(1, 'OldPass123!', 'NewPass123!');
      
      expect(result).toBe(true);
      expect(query).toHaveBeenCalledTimes(2);
    });

    test('should throw error for incorrect old password', async () => {
      const mockUser = {
        password_hash: '$2b$10$test.hash'
      };
      
      query.mockResolvedValueOnce({ rows: [mockUser] });
      
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        authService.changePassword(1, 'WrongOldPass', 'NewPass123!')
      ).rejects.toThrow('Invalid old password');
    });

    test('should throw error when user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.changePassword(999, 'OldPass123!', 'NewPass123!')
      ).rejects.toThrow('User not found');
    });
  });
});
