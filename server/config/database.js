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

// =====================================================
// DATASETS TABLE
// =====================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    abstract TEXT,
    category TEXT,
    keywords TEXT,

    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,

    owner_id INTEGER NOT NULL,

    is_published INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES users(id)
  )
`)

console.log('Database Geoportal Aceh siap.')

module.exports = db