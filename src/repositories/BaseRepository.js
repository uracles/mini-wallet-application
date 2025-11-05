import { query } from '../config/database.js';
import logger from '../utils/logger.js';


class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async execute(sql, params = []) {
    try {
      return await query(sql, params);
    } catch (error) {
      logger.error(`Database query error in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Finds all records matching the conditions
   */
  async findAll(conditions = {}, orderBy = 'created_at DESC', limit = null, offset = null) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];
      let paramIndex = 1;

      if (Object.keys(conditions).length > 0) {
        const whereClauses = Object.keys(conditions).map(key => {
          params.push(conditions[key]);
          return `${key} = $${paramIndex++}`;
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        params.push(limit);
        sql += ` LIMIT $${paramIndex++}`;
      }

      if (offset) {
        params.push(offset);
        sql += ` OFFSET $${paramIndex++}`;
      }

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error in findAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Finds a single record by ID
   */
  async findById(id) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error in findById for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Finds a single record by conditions
   */
  async findOne(conditions) {
    try {
      const params = Object.values(conditions);
      const whereClauses = Object.keys(conditions).map((key, index) =>
        `${key} = $${index + 1}`
      );

      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')}`,
        params
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error in findOne for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new record
   */
  async create(data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const result = await query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      logger.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Updates a record by ID
   */
  async update(id, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

      const result = await query(
        `UPDATE ${this.tableName}
         SET ${setClause}
         WHERE id = $${columns.length + 1}
         RETURNING *`,
        [...values, id]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Updates records by conditions
   */
  async updateWhere(conditions, data) {
    try {
      const updateColumns = Object.keys(data);
      const updateValues = Object.values(data);
      const conditionColumns = Object.keys(conditions);
      const conditionValues = Object.values(conditions);

      let paramIndex = 1;
      const setClause = updateColumns.map(col => `${col} = $${paramIndex++}`).join(', ');
      const whereClause = conditionColumns.map(col => `${col} = $${paramIndex++}`).join(' AND ');

      const result = await query(
        `UPDATE ${this.tableName}
         SET ${setClause}
         WHERE ${whereClause}
         RETURNING *`,
        [...updateValues, ...conditionValues]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error in updateWhere for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a record by ID
   */
  async delete(id) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Counts records matching conditions
   */
  async count(conditions = {}) {
    try {
      let sql = `SELECT COUNT(*) FROM ${this.tableName}`;
      const params = [];

      if (Object.keys(conditions).length > 0) {
        const whereClauses = Object.keys(conditions).map((key, index) => {
          params.push(conditions[key]);
          return `${key} = $${index + 1}`;
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      const result = await query(sql, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error in count for ${this.tableName}:`, error);
      throw error;
    }
  }
}

export default BaseRepository;
