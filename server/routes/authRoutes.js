const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const db = require('../config/database')

const {
  authenticateToken
} = require('../middleware/authMiddleware')

const router = express.Router()


// =====================================================
// LOGIN
// =====================================================

router.post('/login', (req, res) => {

  try {

    const {
      username,
      password
    } = req.body


    if (!username || !password) {

      return res.status(400).json({
        success: false,
        message:
          'Username dan password wajib diisi.'
      })

    }


    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE username = ?
        OR email = ?
      `)
      .get(
        username.trim(),
        username.trim()
      )


    if (!user) {

      return res.status(401).json({
        success: false,
        message:
          'Username atau password salah.'
      })

    }


    const passwordValid =
      bcrypt.compareSync(
        password,
        user.password
      )


    if (!passwordValid) {

      return res.status(401).json({
        success: false,
        message:
          'Username atau password salah.'
      })

    }


    const token =
      jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '8h'
        }
      )


    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {

    console.error(
      'LOGIN ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Terjadi kesalahan server.'
    })

  }

})


// =====================================================
// CURRENT USER
// =====================================================

router.get(
  '/me',
  authenticateToken,
  (req, res) => {

    try {

      const user = db
        .prepare(`
          SELECT
            id,
            username,
            email,
            role,
            created_at
          FROM users
          WHERE id = ?
        `)
        .get(req.user.id)


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'User tidak ditemukan.'
        })

      }


      return res.json({
        success: true,
        user
      })

    } catch (error) {

      console.error(
        'ME ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal mengambil data user.'
      })

    }

  }
)


module.exports = router