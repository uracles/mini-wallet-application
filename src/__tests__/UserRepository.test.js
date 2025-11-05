import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import UserRepository from '../repositories/UserRepository.js';
import { query } from '../config/database.js';

// Mock the database module
jest.mock('../config/database.js');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    test('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.createUser('testuser', 'hashedpassword123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['testuser', 'hashedpassword123']
      );
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user creation fails', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(
        UserRepository.createUser('testuser', 'hashedpassword123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByUsername', () => {
    test('should find user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashedpassword123',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findByUsername('testuser');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, password_hash, created_at FROM users WHERE username = $1'),
        ['testuser']
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await UserRepository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    test('should throw error when database query fails', async () => {
      query.mockRejectedValue(new Error('Database connection error'));

      await expect(
        UserRepository.findByUsername('testuser')
      ).rejects.toThrow('Database connection error');
    });
  });

  describe('findByUsernamePublic', () => {
    test('should find user by username without password hash', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findByUsernamePublic('testuser');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, created_at FROM users WHERE username = $1'),
        ['testuser']
      );
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password_hash');
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await UserRepository.findByUsernamePublic('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdPublic', () => {
    test('should find user by ID without password hash', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findByIdPublic(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, created_at FROM users WHERE id = $1'),
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await UserRepository.findByIdPublic(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithPassword', () => {
    test('should find user by ID with password hash', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashedpassword123',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findByIdWithPassword(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, password_hash, created_at FROM users WHERE id = $1'),
        [1]
      );
      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('password_hash');
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await UserRepository.findByIdWithPassword(999);

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    test('should update user password successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.updatePassword(1, 'newhashpassword456');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash = $1'),
        ['newhashpassword456', 1]
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await UserRepository.updatePassword(999, 'newhashpassword456');

      expect(result).toBeNull();
    });

    test('should throw error when update fails', async () => {
      query.mockRejectedValue(new Error('Update failed'));

      await expect(
        UserRepository.updatePassword(1, 'newhashpassword456')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('usernameExists', () => {
    test('should return true when username exists', async () => {
      query.mockResolvedValue({ rows: [{ exists: true }] });

      const result = await UserRepository.usernameExists('testuser');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        ['testuser']
      );
      expect(result).toBe(true);
    });

    test('should return false when username does not exist', async () => {
      query.mockResolvedValue({ rows: [{ exists: false }] });

      const result = await UserRepository.usernameExists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('countUsers', () => {
    test('should return total user count', async () => {
      query.mockResolvedValue({ rows: [{ count: '42' }] });

      const result = await UserRepository.countUsers();

      expect(query).toHaveBeenCalledWith('SELECT COUNT(*) FROM users');
      expect(result).toBe(42);
    });

    test('should return 0 when no users exist', async () => {
      query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await UserRepository.countUsers();

      expect(result).toBe(0);
    });

    test('should throw error when count fails', async () => {
      query.mockRejectedValue(new Error('Count failed'));

      await expect(
        UserRepository.countUsers()
      ).rejects.toThrow('Count failed');
    });
  });
});

