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

router.post('/login', async (req, res) => {

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


    const user = await db
      .prepare(`
        SELECT *
        FROM users
        WHERE username = $1
        OR email = $1
      `)
      .get(
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

      // #4: avatar_url WAJIB disertakan, sebelumnya
      // hilang sehingga sidebar/navbar tidak pernah
      // tahu user punya foto profil.
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
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
  async (req, res) => {

    try {

      const user = await db
        .prepare(`
          SELECT
            id,
            username,
            email,
            role,
            avatar_url,
            created_at
          FROM users
          WHERE id = $1
        `)
        .get(
          req.user.id
        )


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