const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'geoportal.db')

const db = new Database(dbPath)

// Aktifkan foreign key
db.pragma('foreign_keys = ON')

// =====================================================
// USERS TABLE
// =====================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL UNIQUE,

    email TEXT NOT NULL UNIQUE,

    password TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'operator'
      CHECK(role IN ('admin', 'operator')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

console.log('Database Geoportal Aceh siap.')

module.exports = db