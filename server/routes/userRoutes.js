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

router.get('/', async (req, res) => {

  try {

    const users = await db
      .prepare(`
        SELECT
          id,
          username,
          email,
          role,
          created_at
        FROM users
        ORDER BY id DESC
      `)
      .all()


    res.json({
      success: true,
      users
    })

  } catch (error) {

    console.error(
      'GET USERS ERROR:',
      error
    )

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengguna.'
    })

  }

})


// =====================================================
// CREATE USER
// =====================================================

router.post('/', async (req, res) => {

  try {

    const {
      username,
      email,
      password,
      role
    } = req.body


    // -------------------------------------------------
    // VALIDASI
    // -------------------------------------------------

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


    const cleanUsername =
      username.trim()

    const cleanEmail =
      email.trim().toLowerCase()


    if (
      cleanUsername.length < 3
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Username minimal 3 karakter.'
      })

    }


    if (
      password.length < 6
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Password minimal 6 karakter.'
      })

    }


    // -------------------------------------------------
    // ROLE
    // -------------------------------------------------

    const selectedRole =
      role === 'admin'
        ? 'admin'
        : 'operator'


    // -------------------------------------------------
    // CEK USERNAME / EMAIL
    // -------------------------------------------------

    const existing =
      await db
        .prepare(`
          SELECT
            id,
            username,
            email
          FROM users
          WHERE username = $1
          OR email = $2
        `)
        .get(
          cleanUsername,
          cleanEmail
        )


    if (existing) {

      if (
        existing.username ===
        cleanUsername
      ) {

        return res.status(409).json({
          success: false,
          message:
            'Username sudah digunakan.'
        })

      }


      return res.status(409).json({
        success: false,
        message:
          'Email sudah digunakan.'
      })

    }


    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword =
      bcrypt.hashSync(
        password,
        12
      )


    // -------------------------------------------------
    // INSERT USER
    // -------------------------------------------------

    const result =
      await db
        .prepare(`
          INSERT INTO users
          (
            username,
            email,
            password,
            role
          )
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `)
        .run(
          cleanUsername,
          cleanEmail,
          hashedPassword,
          selectedRole
        )


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.status(201).json({
      success: true,
      message:
        'User berhasil dibuat.',
      user: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        email: cleanEmail,
        role: selectedRole
      }
    })


  } catch (error) {

    console.error(
      'CREATE USER ERROR:',
      error
    )

    res.status(500).json({
      success: false,
      message:
        'Gagal membuat user.'
    })

  }

})


// =====================================================
// DELETE USER
// =====================================================

router.delete(
  '/:id',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      // -------------------------------------------------
      // ADMIN TIDAK BOLEH HAPUS DIRI SENDIRI
      // -------------------------------------------------

      if (
        id === req.user.id
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Admin yang sedang login tidak dapat menghapus dirinya sendiri.'
        })

      }


      const result =
        await db
          .prepare(`
            DELETE FROM users
            WHERE id = $1
          `)
          .run(id)


      if (
        result.changes === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            'User tidak ditemukan.'
        })

      }


      res.json({
        success: true,
        message:
          'User berhasil dihapus.'
      })

    } catch (error) {

      console.error(
        'DELETE USER ERROR:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Gagal menghapus user.'
      })

    }

  }
)


module.exports = router