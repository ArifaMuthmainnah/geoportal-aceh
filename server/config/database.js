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

      async all(...params) {

        const result =
          await pool.query(
            sql,
            params
          )

        return result.rows

      },

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

      resource_type TEXT NOT NULL
      DEFAULT 'dataset',


      category TEXT,

      keywords TEXT,

      file_path TEXT,

      file_name TEXT,

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


  // ---------------------------------------------------
  // MIGRASI KOLOM: file_path / file_name jadi NULLABLE
  // ---------------------------------------------------
  //
  // Diperlukan karena sekarang resource bisa berupa
  // LINK (dashboard/webgis eksternal), bukan cuma file.
  //
  // ---------------------------------------------------

  await pool.query(`
    ALTER TABLE datasets
    ALTER COLUMN file_path DROP NOT NULL
  `)

  await pool.query(`
    ALTER TABLE datasets
    ALTER COLUMN file_name DROP NOT NULL
  `)


  // ---------------------------------------------------
  // MIGRASI KOLOM BARU
  // ---------------------------------------------------
  //
  // content_type   : 'file' atau 'link'
  // external_url   : dipakai kalau content_type = 'link'
  // extra_metadata : JSON string berisi metadata tambahan
  //                  (attributes, srid, bbox, region,
  //                  language, attribution, purpose, dll)
  //                  supaya halaman detail bisa menampilkan
  //                  info selengkap data dari API lama.
  //
  // ---------------------------------------------------

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'file'
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS external_url TEXT
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS extra_metadata TEXT
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS files_json TEXT
  `)

  // ---------------------------------------------------
  // MIGRASI KOLOM AVATAR USER
  // ---------------------------------------------------

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT
  `)

  // ---------------------------------------------------
  // PERBAIKI CONSTRAINT resource_type
  // ---------------------------------------------------
  //
  // BUG LAMA: constraint hanya mengizinkan
  // ('dataset','application','webgis'), padahal seluruh
  // kode aplikasi (routes & frontend) memakai 'dashboard'.
  // Akibatnya SETIAP upload dashboard GAGAL karena
  // melanggar CHECK constraint di database.
  //
  // ---------------------------------------------------

    // Kolom thumbnail (#1) dan sub_type (#11, untuk
  // membedakan pemberitahuan/agenda/berita pada resource
  // type 'informasi')

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS thumbnail_path TEXT
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS sub_type TEXT
  `)

  await pool.query(`
    ALTER TABLE datasets
    DROP CONSTRAINT IF EXISTS datasets_resource_type_check
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD CONSTRAINT datasets_resource_type_check
    CHECK (
      resource_type IN (
        'dataset',
        'dashboard',
        'map',
        'document',
        'informasi'
      )
    )
  `)


  // ---------------------------------------------------
  // PERBAIKI CONSTRAINT content_type
  // ---------------------------------------------------

  await pool.query(`
    ALTER TABLE datasets
    DROP CONSTRAINT IF EXISTS datasets_content_type_check
  `)

  await pool.query(`
    ALTER TABLE datasets
    ADD CONSTRAINT datasets_content_type_check
    CHECK (
      content_type IN (
        'file',
        'link',
        'both'
      )
    )
  `)


  // ---------------------------------------------------
  // API OVERRIDES
  // ---------------------------------------------------
  //
  // Menyimpan "penyesuaian lokal" terhadap data dari API
  // Geoportal Aceh lama, TANPA mengubah data aslinya:
  // - is_hidden       : sembunyikan dari web kita
  // - title_override  : ganti judul tampilan di web kita
  // - abstract_override
  // - category_override
  //
  // resource_type: 'dataset' atau 'geoapp'
  // external_id  : pk/id resource di API lama
  //
  // ---------------------------------------------------

  await pool.query(`

    CREATE TABLE IF NOT EXISTS api_overrides (

      id SERIAL PRIMARY KEY,

      resource_type TEXT NOT NULL,

      external_id TEXT NOT NULL,

      is_hidden INTEGER NOT NULL DEFAULT 0,

      title_override TEXT,

      abstract_override TEXT,

      category_override TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT api_overrides_type_check

      CHECK (
        resource_type IN (
          'dataset',
          'geoapp'
        )
      ),

      CONSTRAINT api_overrides_unique

      UNIQUE (
        resource_type,
        external_id
      )

    )

  `)


  console.log(
    'Tabel users, datasets, dan api_overrides siap.'
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