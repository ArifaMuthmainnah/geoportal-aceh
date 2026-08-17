const express = require('express')
const bcrypt = require('bcryptjs')

const db = require('../config/database')

const {
  authenticateToken,
  requireAdmin
} = require('../middleware/authMiddleware')


const router = express.Router()


// =====================================================
// SEMUA ROUTE DI SINI WAJIB ADMIN
// =====================================================

router.use(
  authenticateToken,
  requireAdmin
)


// =====================================================
// GET ALL USERS
// =====================================================

router.get('/', (req, res) => {

  const users = db
    .prepare(
      `
        SELECT
          id,
          username,
          email,
          role,
          created_at
        FROM users
        ORDER BY id DESC
      `
    )
    .all()


  res.json({
    success: true,
    users
  })

})


// =====================================================
// CREATE USER
// =====================================================

router.post('/', (req, res) => {

  try {

    const {
      username,
      email,
      password,
      role
    } = req.body


    if (
      !username ||
      !email ||
      !password
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Username, email, dan password wajib diisi.'
      })

    }


    const selectedRole =
      role === 'admin'
        ? 'admin'
        : 'operator'


    const existing =
      db
        .prepare(
          `
            SELECT id
            FROM users
            WHERE username = ?
            OR email = ?
          `
        )
        .get(
          username,
          email
        )


    if (existing) {

      return res.status(409).json({
        success: false,
        message:
          'Username atau email sudah digunakan.'
      })

    }


    const hashedPassword =
      bcrypt.hashSync(
        password,
        12
      )


    const result =
      db
        .prepare(
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
        )
        .run(
          username,
          email,
          hashedPassword,
          selectedRole
        )


    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat.',
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        role: selectedRole
      }
    })


  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: 'Gagal membuat user.'
    })

  }

})


// =====================================================
// DELETE USER
// =====================================================

router.delete('/:id', (req, res) => {

  const id =
    Number(req.params.id)


  // Admin tidak boleh menghapus dirinya sendiri
  if (id === req.user.id) {

    return res.status(400).json({
      success: false,
      message:
        'Admin yang sedang login tidak dapat menghapus dirinya sendiri.'
    })

  }


  const result =
    db
      .prepare(
        `
          DELETE FROM users
          WHERE id = ?
        `
      )
      .run(id)


  if (result.changes === 0) {

    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan.'
    })

  }


  res.json({
    success: true,
    message: 'User berhasil dihapus.'
  })

})


module.exports = router