require('dotenv').config()

const bcrypt = require('bcryptjs')

const db = require('../config/database')

const username =
  process.env.ADMIN_USERNAME || 'admin'

const email =
  process.env.ADMIN_EMAIL || 'admin@geoportalaceh.id'

const password =
  process.env.ADMIN_PASSWORD || 'AdminGeoportal123!'


// =====================================================
// CEK ADMIN
// =====================================================

const existingAdmin = db
  .prepare(
    `
      SELECT id
      FROM users
      WHERE username = ?
      OR email = ?
    `
  )
  .get(username, email)


if (existingAdmin) {

  console.log('Admin sudah tersedia.')

  process.exit(0)

}


// =====================================================
// HASH PASSWORD
// =====================================================

const hashedPassword =
  bcrypt.hashSync(password, 12)


// =====================================================
// INSERT ADMIN
// =====================================================

db.prepare(
  `
    INSERT INTO users
    (
      username,
      email,
      password,
      role
    )
    VALUES (?, ?, ?, ?)
  `
).run(
  username,
  email,
  hashedPassword,
  'admin'
)


console.log('======================================')
console.log('ADMIN BERHASIL DIBUAT')
console.log('======================================')
console.log(`Username : ${username}`)
console.log(`Email    : ${email}`)
console.log(`Password : ${password}`)
console.log('======================================')

process.exit(0)