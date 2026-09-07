require('dotenv').config()

const Database = require('better-sqlite3')
const { Pool } = require('pg')
const path = require('path')

// =====================================================
// SQLITE LAMA
// =====================================================

const sqlitePath = path.join(
  __dirname,
  '..',
  'geoportal.db'
)

const sqlite = new Database(sqlitePath)

// =====================================================
// SUPABASE POSTGRESQL
// =====================================================

const pool = new Pool({
  connectionString:
    process.env.SUPABASE_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// =====================================================
// MIGRATION
// =====================================================

async function migrate() {

  const client = await pool.connect()

  try {

    console.log('')
    console.log('======================================')
    console.log(' MIGRASI SQLITE → SUPABASE')
    console.log('======================================')

    // -------------------------------------------------
    // TEST CONNECTION
    // -------------------------------------------------

    await client.query('SELECT NOW()')

    console.log('✓ Berhasil terhubung ke Supabase.')

    // -------------------------------------------------
    // AMBIL USERS DARI SQLITE
    // -------------------------------------------------

    const users = sqlite
      .prepare(`
        SELECT
          id,
          username,
          email,
          password,
          role,
          created_at
        FROM users
        ORDER BY id
      `)
      .all()

    console.log(
      `✓ Ditemukan ${users.length} user dari SQLite.`
    )

    // -------------------------------------------------
    // AMBIL DATASETS DARI SQLITE
    // -------------------------------------------------

    const datasets = sqlite
      .prepare(`
        SELECT
          id,
          title,
          abstract,
          category,
          keywords,
          file_path,
          file_name,
          owner_id,
          is_published,
          created_at
        FROM datasets
        ORDER BY id
      `)
      .all()

    console.log(
      `✓ Ditemukan ${datasets.length} dataset dari SQLite.`
    )

    // -------------------------------------------------
    // TRANSACTION
    // -------------------------------------------------

    await client.query('BEGIN')

    // -------------------------------------------------
    // MIGRASI USERS
    // -------------------------------------------------

    console.log('')
    console.log('Migrasi users...')

    for (const user of users) {

      await client.query(
        `
          INSERT INTO users
          (
            id,
            username,
            email,
            password,
            role,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id)
          DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            role = EXCLUDED.role,
            created_at = EXCLUDED.created_at
        `,
        [
          user.id,
          user.username,
          user.email,
          user.password,
          user.role,
          user.created_at
        ]
      )

      console.log(
        `  ✓ ${user.username} (${user.role})`
      )
    }

    // -------------------------------------------------
    // PERBAIKI SEQUENCE USER ID
    // -------------------------------------------------

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        COALESCE(
          (SELECT MAX(id) FROM users),
          1
        )
      )
    `)

    // -------------------------------------------------
    // MIGRASI DATASETS
    // -------------------------------------------------

    console.log('')
    console.log('Migrasi datasets...')

    for (const dataset of datasets) {

      // Pastikan owner masih ada
      const owner = await client.query(
        `
          SELECT id
          FROM users
          WHERE id = $1
        `,
        [dataset.owner_id]
      )

      if (owner.rows.length === 0) {

        console.log(
          `  ⚠ Dataset "${dataset.title}" dilewati karena owner_id ${dataset.owner_id} tidak ditemukan.`
        )

        continue
      }

      await client.query(
        `
          INSERT INTO datasets
          (
            id,
            title,
            abstract,
            category,
            keywords,
            file_path,
            file_name,
            owner_id,
            is_published,
            created_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
          )
          ON CONFLICT (id)
          DO UPDATE SET
            title = EXCLUDED.title,
            abstract = EXCLUDED.abstract,
            category = EXCLUDED.category,
            keywords = EXCLUDED.keywords,
            file_path = EXCLUDED.file_path,
            file_name = EXCLUDED.file_name,
            owner_id = EXCLUDED.owner_id,
            is_published = EXCLUDED.is_published,
            created_at = EXCLUDED.created_at
        `,
        [
          dataset.id,
          dataset.title,
          dataset.abstract,
          dataset.category,
          dataset.keywords,
          dataset.file_path,
          dataset.file_name,
          dataset.owner_id,
          dataset.is_published,
          dataset.created_at
        ]
      )

      console.log(
        `  ✓ ${dataset.title}`
      )
    }

    // -------------------------------------------------
    // PERBAIKI SEQUENCE DATASET ID
    // -------------------------------------------------

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('datasets', 'id'),
        COALESCE(
          (SELECT MAX(id) FROM datasets),
          1
        )
      )
    `)

    // -------------------------------------------------
    // COMMIT
    // -------------------------------------------------

    await client.query('COMMIT')

    console.log('')
    console.log('======================================')
    console.log(' MIGRASI BERHASIL')
    console.log('======================================')

    console.log(
      `Users    : ${users.length}`
    )

    console.log(
      `Datasets : ${datasets.length}`
    )

    console.log('')
    console.log(
      'Data SQLite sudah disalin ke Supabase.'
    )

  } catch (error) {

    await client.query('ROLLBACK')

    console.error('')
    console.error('======================================')
    console.error(' MIGRASI GAGAL')
    console.error('======================================')
    console.error(error)

    process.exitCode = 1

  } finally {

    client.release()

    await pool.end()

    sqlite.close()
  }
}

migrate()