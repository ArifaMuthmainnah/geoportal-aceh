const express = require('express')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const db = require('../config/database')

const {
  authenticateToken,
  requireAdmin
} = require('../middleware/authMiddleware')


const router = express.Router()


// =====================================================
// FOLDER UPLOAD AVATAR
// =====================================================

const avatarDir = path.join(
  __dirname,
  '..',
  'uploads',
  'avatars'
)

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

const avatarStorage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, avatarDir)
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }

})

const uploadAvatar = multer({ storage: avatarStorage })


// =====================================================
// DAFTAR PENGGUNA PUBLIK (UNTUK HALAMAN JIGN)
// =====================================================

router.get('/public', async (req, res) => {

  try {

    const users = await db
      .prepare(`
        SELECT
          u.id,
          u.username,
          u.email,
          u.avatar_url,
          COUNT(d.id) FILTER (
            WHERE d.is_published = 1
          ) AS count
        FROM users u
        LEFT JOIN datasets d
          ON d.owner_id = u.id
        GROUP BY u.id, u.username, u.email, u.avatar_url
        ORDER BY u.id ASC
      `)
      .all()

    res.json({
      success: true,
      users
    })

  } catch (error) {

    console.error('GET PUBLIC USERS ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengguna publik.'
    })

  }

})


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
          avatar_url,
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

    console.error('GET USERS ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengguna.'
    })

  }

})


// =====================================================
// CREATE USER (mendukung upload avatar)
// =====================================================

router.post(
  '/',
  uploadAvatar.single('avatar'),
  async (req, res) => {

    try {

      const {
        username,
        email,
        password,
        role
      } = req.body


      if (!username || !email || !password) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(400).json({
          success: false,
          message: 'Username, email, dan password wajib diisi.'
        })

      }


      const cleanUsername = username.trim()
      const cleanEmail = email.trim().toLowerCase()


      if (cleanUsername.length < 3) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(400).json({
          success: false,
          message: 'Username minimal 3 karakter.'
        })

      }


      if (password.length < 6) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter.'
        })

      }


      const selectedRole = role === 'admin' ? 'admin' : 'operator'


      const existing =
        await db
          .prepare(`
            SELECT id, username, email
            FROM users
            WHERE username = $1 OR email = $2
          `)
          .get(cleanUsername, cleanEmail)


      if (existing) {

        if (req.file) fs.unlinkSync(req.file.path)

        if (existing.username === cleanUsername) {
          return res.status(409).json({
            success: false,
            message: 'Username sudah digunakan.'
          })
        }

        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan.'
        })

      }


      const hashedPassword = bcrypt.hashSync(password, 12)

      const avatarUrl =
        req.file ? `avatars/${req.file.filename}` : null


      const result =
        await db
          .prepare(`
            INSERT INTO users
            (username, email, password, role, avatar_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `)
          .run(
            cleanUsername,
            cleanEmail,
            hashedPassword,
            selectedRole,
            avatarUrl
          )


      res.status(201).json({
        success: true,
        message: 'User berhasil dibuat.',
        user: {
          id: result.lastInsertRowid,
          username: cleanUsername,
          email: cleanEmail,
          role: selectedRole,
          avatar_url: avatarUrl
        }
      })


    } catch (error) {

      console.error('CREATE USER ERROR:', error)

      if (req.file) {
        try { fs.unlinkSync(req.file.path) } catch {}
      }

      res.status(500).json({
        success: false,
        message: 'Gagal membuat user.'
      })

    }

  }
)


// =====================================================
// UPDATE USER (BARU — INI YANG SEBELUMNYA HILANG,
// PENYEBAB ERROR 404 SAAT EDIT PENGGUNA)
// =====================================================

router.patch(
  '/:id',
  uploadAvatar.single('avatar'),
  async (req, res) => {

    try {

      const id = Number(req.params.id)

      if (!Number.isInteger(id)) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(400).json({
          success: false,
          message: 'ID pengguna tidak valid.'
        })

      }


      const existingUser =
        await db
          .prepare(`SELECT * FROM users WHERE id = $1`)
          .get(id)


      if (!existingUser) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan.'
        })

      }


      const {
        username,
        email,
        password,
        role
      } = req.body


      const nextUsername =
        username !== undefined && username.trim()
          ? username.trim()
          : existingUser.username

      const nextEmail =
        email !== undefined && email.trim()
          ? email.trim().toLowerCase()
          : existingUser.email

      const nextRole =
        role !== undefined
          ? (role === 'admin' ? 'admin' : 'operator')
          : existingUser.role


      // cek bentrok username/email dengan user lain
      const conflict =
        await db
          .prepare(`
            SELECT id FROM users
            WHERE (username = $1 OR email = $2)
            AND id != $3
          `)
          .get(nextUsername, nextEmail, id)

      if (conflict) {

        if (req.file) fs.unlinkSync(req.file.path)

        return res.status(409).json({
          success: false,
          message: 'Username atau email sudah digunakan pengguna lain.'
        })

      }


      let nextPasswordHash = existingUser.password

      if (password && password.trim()) {

        if (password.trim().length < 6) {

          if (req.file) fs.unlinkSync(req.file.path)

          return res.status(400).json({
            success: false,
            message: 'Password minimal 6 karakter.'
          })

        }

        nextPasswordHash = bcrypt.hashSync(password.trim(), 12)

      }


      let nextAvatarUrl = existingUser.avatar_url

      if (req.file) {

        // hapus avatar lama kalau ada
        if (existingUser.avatar_url) {

          const oldPath =
            path.join(__dirname, '..', 'uploads', existingUser.avatar_url)

          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath) } catch {}
          }

        }

        nextAvatarUrl = `avatars/${req.file.filename}`

      }


      await db
        .prepare(`
          UPDATE users
          SET
            username = $1,
            email = $2,
            role = $3,
            password = $4,
            avatar_url = $5
          WHERE id = $6
        `)
        .run(
          nextUsername,
          nextEmail,
          nextRole,
          nextPasswordHash,
          nextAvatarUrl,
          id
        )


      res.json({
        success: true,
        message: 'Pengguna berhasil diperbarui.',
        user: {
          id,
          username: nextUsername,
          email: nextEmail,
          role: nextRole,
          avatar_url: nextAvatarUrl
        }
      })


    } catch (error) {

      console.error('UPDATE USER ERROR:', error)

      if (req.file) {
        try { fs.unlinkSync(req.file.path) } catch {}
      }

      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengguna.'
      })

    }

  }
)


// =====================================================
// DELETE USER
// =====================================================

router.delete(
  '/:id',
  async (req, res) => {

    try {

      const id = Number(req.params.id)

      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Admin yang sedang login tidak dapat menghapus dirinya sendiri.'
        })
      }

      const target =
        await db
          .prepare(`SELECT avatar_url FROM users WHERE id = $1`)
          .get(id)

      const result =
        await db
          .prepare(`DELETE FROM users WHERE id = $1`)
          .run(id)

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan.'
        })
      }

      if (target?.avatar_url) {
        const avatarPath =
          path.join(__dirname, '..', 'uploads', target.avatar_url)
        if (fs.existsSync(avatarPath)) {
          try { fs.unlinkSync(avatarPath) } catch {}
        }
      }

      res.json({
        success: true,
        message: 'User berhasil dihapus.'
      })

    } catch (error) {

      console.error('DELETE USER ERROR:', error)

      res.status(500).json({
        success: false,
        message: 'Gagal menghapus user.'
      })

    }

  }
)


module.exports = router