const { Pool } = require('pg')
require('dotenv').config()

// =====================================================
// POSTGRESQL SUPABASE
// =====================================================

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,

  ssl: {
    rejectUnauthorized: false
  }
})

// =====================================================
// DATABASE WRAPPER
// =====================================================

const db = {

  prepare(sql) {

    return {

      // -------------------------------------------------
      // SELECT SATU DATA
      // -------------------------------------------------

      async get(...params) {

        const result =
          await pool.query(
            sql,
            params
          )

        return (
          result.rows[0] ||
          undefined
        )

      },

      // -------------------------------------------------
      // SELECT BANYAK DATA
      // -------------------------------------------------

      async all(...params) {

        const result =
          await pool.query(
            sql,
            params
          )

        return result.rows

      },

      // -------------------------------------------------
      // INSERT / UPDATE / DELETE
      // -------------------------------------------------

      async run(...params) {

        const result =
          await pool.query(
            sql,
            params
          )

        return {

          changes:
            result.rowCount,

          lastInsertRowid:
            result.rows[0]?.id ||
            null

        }

      }

    }

  },

  // ---------------------------------------------------
  // RAW QUERY
  // ---------------------------------------------------

  async exec(sql) {

    return pool.query(sql)

  }

}


// =====================================================
// TEST CONNECTION
// =====================================================

async function testDatabase() {

  try {

    const result =
      await pool.query(
        'SELECT NOW() AS now'
      )

    console.log(
      'Database Supabase PostgreSQL berhasil terhubung.'
    )

    console.log(
      'Database time:',
      result.rows[0].now
    )

  } catch (error) {

    console.error(
      'DATABASE CONNECTION ERROR:',
      error.message
    )

    console.error(
      'DATABASE CONNECTION DETAIL:',
      error
    )

    process.exit(1)

  }

}


// =====================================================
// CREATE TABLES
// =====================================================

async function initializeDatabase() {

  // ---------------------------------------------------
  // USERS
  // ---------------------------------------------------

  await pool.query(`

    CREATE TABLE IF NOT EXISTS users (

      id SERIAL PRIMARY KEY,

      username TEXT NOT NULL UNIQUE,

      email TEXT NOT NULL UNIQUE,

      password TEXT NOT NULL,

      role TEXT NOT NULL DEFAULT 'operator',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT users_role_check

      CHECK (
        role IN (
          'admin',
          'operator'
        )
      )

    )

  `)


  // ---------------------------------------------------
  // DATASETS
  // ---------------------------------------------------

  await pool.query(`

    CREATE TABLE IF NOT EXISTS datasets (

      id SERIAL PRIMARY KEY,

      title TEXT NOT NULL,

      abstract TEXT,

      category TEXT,

      keywords TEXT,

      file_path TEXT NOT NULL,

      file_name TEXT NOT NULL,

      owner_id INTEGER NOT NULL,

      is_published INTEGER NOT NULL DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT datasets_owner_fk

      FOREIGN KEY (
        owner_id
      )

      REFERENCES users(id)

      ON DELETE CASCADE

    )

  `)


  console.log(
    'Tabel users dan datasets siap.'
  )

}


// =====================================================
// INITIALIZE DATABASE
// =====================================================

async function initialize() {

  await testDatabase()

  await initializeDatabase()

}


// =====================================================
// RUN INITIALIZATION
// =====================================================

initialize()

  .catch(error => {

    console.error(
      'DATABASE INITIALIZATION ERROR:',
      error
    )

    process.exit(1)

  })


// =====================================================
// EXPORT
// =====================================================

module.exports = db