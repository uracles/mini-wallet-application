import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import BaseRepository from '../repositories/BaseRepository.js';
import { query } from '../config/database.js';

// Mock the database module
jest.mock('../config/database.js');

describe('BaseRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BaseRepository('test_table');
  });

  describe('constructor', () => {
    test('should set table name', () => {
      expect(repository.tableName).toBe('test_table');
    });
  });

  describe('execute', () => {
    test('should execute SQL query successfully', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      query.mockResolvedValue(mockResult);

      const result = await repository.execute('SELECT * FROM test_table', []);

      expect(query).toHaveBeenCalledWith('SELECT * FROM test_table', []);
      expect(result).toEqual(mockResult);
    });

    test('should throw error when query fails', async () => {
      query.mockRejectedValue(new Error('Query failed'));

      await expect(
        repository.execute('INVALID SQL', [])
      ).rejects.toThrow('Query failed');
    });
  });

  describe('findAll', () => {
    test('should find all records without conditions', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      query.mockResolvedValue({ rows: mockRows });

      const result = await repository.findAll();

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM test_table ORDER BY created_at DESC',
        []
      );
      expect(result).toEqual(mockRows);
    });

    test('should find records with conditions', async () => {
      const mockRows = [{ id: 1, status: 'active' }];
      query.mockResolvedValue({ rows: mockRows });

      const result = await repository.findAll({ status: 'active' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      );
      expect(result).toEqual(mockRows);
    });

    test('should apply limit and offset', async () => {
      query.mockResolvedValue({ rows: [] });

      await repository.findAll({}, 'created_at DESC', 10, 5);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [10, 5]
      );
    });

    test('should apply custom ordering', async () => {
      query.mockResolvedValue({ rows: [] });

      await repository.findAll({}, 'name ASC');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        []
      );
    });

    test('should handle multiple conditions', async () => {
      query.mockResolvedValue({ rows: [] });

      await repository.findAll({ status: 'active', type: 'premium' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1 AND type = $2'),
        ['active', 'premium']
      );
    });
  });

  describe('findById', () => {
    test('should find record by ID', async () => {
      const mockRow = { id: 1, name: 'Test' };
      query.mockResolvedValue({ rows: [mockRow] });

      const result = await repository.findById(1);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockRow);
    });

    test('should return null when record not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    test('should find one record by conditions', async () => {
      const mockRow = { id: 1, username: 'testuser' };
      query.mockResolvedValue({ rows: [mockRow] });

      const result = await repository.findOne({ username: 'testuser' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE username = $1'),
        ['testuser']
      );
      expect(result).toEqual(mockRow);
    });

    test('should return null when no record matches', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await repository.findOne({ username: 'nonexistent' });

      expect(result).toBeNull();
    });

    test('should handle multiple conditions', async () => {
      query.mockResolvedValue({ rows: [] });

      await repository.findOne({ status: 'active', type: 'admin' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1 AND type = $2'),
        ['active', 'admin']
      );
    });
  });

  describe('create', () => {
    test('should create a new record', async () => {
      const mockRow = { id: 1, name: 'Test', status: 'active' };
      query.mockResolvedValue({ rows: [mockRow] });

      const result = await repository.create({ name: 'Test', status: 'active' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO test_table'),
        ['Test', 'active']
      );
      expect(result).toEqual(mockRow);
    });

    test('should throw error when creation fails', async () => {
      query.mockRejectedValue(new Error('Creation failed'));

      await expect(
        repository.create({ name: 'Test' })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    test('should update a record by ID', async () => {
      const mockRow = { id: 1, name: 'Updated', status: 'active' };
      query.mockResolvedValue({ rows: [mockRow] });

      const result = await repository.update(1, { name: 'Updated', status: 'active' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE test_table'),
        ['Updated', 'active', 1]
      );
      expect(result).toEqual(mockRow);
    });

    test('should return null when record not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await repository.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('updateWhere', () => {
    test('should update records by conditions', async () => {
      const mockRows = [{ id: 1, status: 'inactive' }];
      query.mockResolvedValue({ rows: mockRows });

      const result = await repository.updateWhere(
        { status: 'active' },
        { status: 'inactive' }
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE test_table'),
        ['inactive', 'active']
      );
      expect(result).toEqual(mockRows);
    });

    test('should handle multiple conditions and updates', async () => {
      query.mockResolvedValue({ rows: [] });

      await repository.updateWhere(
        { status: 'active', type: 'user' },
        { status: 'inactive', updated: true }
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SET status = $1, updated = $2'),
        ['inactive', true, 'active', 'user']
      );
    });
  });

  describe('delete', () => {
    test('should delete a record by ID', async () => {
      const mockRow = { id: 1, name: 'Deleted' };
      query.mockResolvedValue({ rows: [mockRow] });

      const result = await repository.delete(1);

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM test_table WHERE id = $1 RETURNING *',
        [1]
      );
      expect(result).toEqual(mockRow);
    });

    test('should return null when record not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await repository.delete(999);

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    test('should count all records without conditions', async () => {
      query.mockResolvedValue({ rows: [{ count: '25' }] });

      const result = await repository.count();

      expect(query).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM test_table',
        []
      );
      expect(result).toBe(25);
    });

    test('should count records with conditions', async () => {
      query.mockResolvedValue({ rows: [{ count: '10' }] });

      const result = await repository.count({ status: 'active' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      );
      expect(result).toBe(10);
    });

    test('should return 0 when no records match', async () => {
      query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await repository.count({ status: 'nonexistent' });

      expect(result).toBe(0);
    });

    test('should handle multiple conditions', async () => {
      query.mockResolvedValue({ rows: [{ count: '5' }] });

      await repository.count({ status: 'active', type: 'premium' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1 AND type = $2'),
        ['active', 'premium']
      );
    });
  });
});

