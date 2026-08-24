const express = require('express')
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
// FOLDER UPLOAD
// =====================================================

const uploadDir = path.join(
  __dirname,
  '..',
  'uploads'
)

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  })
}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(
      null,
      uploadDir
    )

  },

  filename: (req, file, cb) => {

    const unique =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 1e9
      )

    cb(
      null,
      unique +
      path.extname(
        file.originalname
      )
    )

  }

})


const upload =
  multer({
    storage
  })


// =====================================================
// DATASET PUBLIK
// =====================================================
// Tidak membutuhkan login.
// Digunakan oleh Home dan Katalog.
// =====================================================

router.get(
  '/published',
  async (req, res) => {

    try {

      const datasets =
        await db
          .prepare(`
            SELECT
              d.id,
              d.title,
              d.abstract,
              d.category,
              d.keywords,
              d.created_at,
              u.username AS owner_username
            FROM datasets d
            JOIN users u
              ON u.id = d.owner_id
            WHERE d.is_published = 1
            ORDER BY d.created_at DESC
          `)
          .all()


      return res.json({
        success: true,
        datasets
      })

    } catch (error) {

      console.error(
        'GET PUBLISHED DATASETS ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal mengambil dataset publik.'
      })

    }

  }
)


// =====================================================
// SEMUA ROUTE SETELAH INI WAJIB LOGIN
// =====================================================

router.use(
  authenticateToken
)


// =====================================================
// UPLOAD DATASET
// =====================================================

router.post(
  '/',
  upload.single('base_file'),
  async (req, res) => {

    try {

      const {
        title,
        abstract,
        category,
        keywords
      } = req.body


      // -------------------------------------------------
      // VALIDASI FILE
      // -------------------------------------------------

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message:
            'File wajib diunggah.'
        })

      }


      // -------------------------------------------------
      // VALIDASI JUDUL
      // -------------------------------------------------

      if (!title || !title.trim()) {

        // Hapus file jika validasi gagal
        if (
          req.file &&
          fs.existsSync(
            path.join(
              uploadDir,
              req.file.filename
            )
          )
        ) {

          fs.unlinkSync(
            path.join(
              uploadDir,
              req.file.filename
            )
          )

        }

        return res.status(400).json({
          success: false,
          message:
            'Judul dataset wajib diisi.'
        })

      }


      // -------------------------------------------------
      // INSERT DATASET
      // -------------------------------------------------

      const result =
        await db
          .prepare(`
            INSERT INTO datasets
            (
              title,
              abstract,
              category,
              keywords,
              file_path,
              file_name,
              owner_id,
              is_published
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
              0
            )
            RETURNING id
          `)
          .run(
            title.trim(),
            abstract || '',
            category || '',
            keywords || '',
            req.file.filename,
            req.file.originalname,
            req.user.id
          )


      return res.status(201).json({

        success: true,

        message:
          'Dataset berhasil diunggah, menunggu review admin.',

        dataset: {

          id:
            result.lastInsertRowid,

          title:
            title.trim(),

          abstract:
            abstract || '',

          category:
            category || '',

          keywords:
            keywords || '',

          owner_id:
            req.user.id,

          is_published:
            false

        }

      })

    } catch (error) {

      console.error(
        'UPLOAD DATASET ERROR:',
        error
      )

      // Jika database gagal setelah file
      // berhasil di-upload, hapus file tersebut.
      if (
        req.file &&
        fs.existsSync(
          path.join(
            uploadDir,
            req.file.filename
          )
        )
      ) {

        try {

          fs.unlinkSync(
            path.join(
              uploadDir,
              req.file.filename
            )
          )

        } catch (fileError) {

          console.error(
            'GAGAL MENGHAPUS FILE:',
            fileError
          )

        }

      }


      return res.status(500).json({
        success: false,
        message:
          'Gagal mengunggah dataset.'
      })

    }

  }
)


// =====================================================
// DATASET SAYA
// =====================================================
// Operator melihat dataset miliknya.
// =====================================================

router.get(
  '/mine',
  async (req, res) => {

    try {

      const datasets =
        await db
          .prepare(`
            SELECT *
            FROM datasets
            WHERE owner_id = $1
            ORDER BY created_at DESC
          `)
          .all(
            req.user.id
          )


      return res.json({
        success: true,
        datasets
      })

    } catch (error) {

      console.error(
        'GET MY DATASETS ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal mengambil dataset saya.'
      })

    }

  }
)


// =====================================================
// SEMUA DATASET
// =====================================================
// ADMIN ONLY
// =====================================================

router.get(
  '/',
  requireAdmin,
  async (req, res) => {

    try {

      const datasets =
        await db
          .prepare(`
            SELECT
              d.*,
              u.username AS owner_username
            FROM datasets d
            JOIN users u
              ON u.id = d.owner_id
            ORDER BY d.created_at DESC
          `)
          .all()


      return res.json({
        success: true,
        datasets
      })

    } catch (error) {

      console.error(
        'GET ALL DATASETS ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal mengambil semua dataset.'
      })

    }

  }
)


// =====================================================
// EDIT / PUBLISH DATASET
// =====================================================
// Owner:
// - boleh edit title
// - boleh edit abstract
//
// Admin:
// - boleh edit title
// - boleh edit abstract
// - boleh publish / unpublish
// =====================================================

router.patch(
  '/:id',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      // -------------------------------------------------
      // VALIDASI ID
      // -------------------------------------------------

      if (!Number.isInteger(id)) {

        return res.status(400).json({
          success: false,
          message:
            'ID dataset tidak valid.'
        })

      }


      // -------------------------------------------------
      // CARI DATASET
      // -------------------------------------------------

      const dataset =
        await db
          .prepare(`
            SELECT *
            FROM datasets
            WHERE id = $1
          `)
          .get(id)


      if (!dataset) {

        return res.status(404).json({
          success: false,
          message:
            'Dataset tidak ditemukan.'
        })

      }


      // -------------------------------------------------
      // CEK HAK AKSES
      // -------------------------------------------------

      const isOwner =
        dataset.owner_id === req.user.id

      const isAdmin =
        req.user.role === 'admin'


      if (
        !isOwner &&
        !isAdmin
      ) {

        return res.status(403).json({
          success: false,
          message:
            'Tidak punya izin mengubah dataset ini.'
        })

      }


      // -------------------------------------------------
      // DATA BARU
      // -------------------------------------------------

      const {
        title,
        abstract,
        is_published
      } = req.body


      const nextTitle =
        title !== undefined
          ? title
          : dataset.title


      const nextAbstract =
        abstract !== undefined
          ? abstract
          : dataset.abstract


      // Hanya admin yang boleh
      // mengubah status publish.

      const nextPublished =
        isAdmin &&
        is_published !== undefined

          ? (
              is_published
                ? 1
                : 0
            )

          : dataset.is_published


      // -------------------------------------------------
      // UPDATE
      // -------------------------------------------------

      await db
        .prepare(`
          UPDATE datasets
          SET
            title = $1,
            abstract = $2,
            is_published = $3
          WHERE id = $4
        `)
        .run(
          nextTitle,
          nextAbstract,
          nextPublished,
          id
        )


      return res.json({
        success: true,
        message:
          'Dataset berhasil diperbarui.'
      })

    } catch (error) {

      console.error(
        'UPDATE DATASET ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal memperbarui dataset.'
      })

    }

  }
)


// =====================================================
// HAPUS DATASET
// =====================================================
// Owner boleh hapus dataset sendiri.
// Admin boleh hapus dataset siapa saja.
// =====================================================

router.delete(
  '/:id',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      // -------------------------------------------------
      // VALIDASI ID
      // -------------------------------------------------

      if (!Number.isInteger(id)) {

        return res.status(400).json({
          success: false,
          message:
            'ID dataset tidak valid.'
        })

      }


      // -------------------------------------------------
      // CARI DATASET
      // -------------------------------------------------

      const dataset =
        await db
          .prepare(`
            SELECT *
            FROM datasets
            WHERE id = $1
          `)
          .get(id)


      if (!dataset) {

        return res.status(404).json({
          success: false,
          message:
            'Dataset tidak ditemukan.'
        })

      }


      // -------------------------------------------------
      // CEK HAK AKSES
      // -------------------------------------------------

      const isOwner =
        dataset.owner_id === req.user.id

      const isAdmin =
        req.user.role === 'admin'


      if (
        !isOwner &&
        !isAdmin
      ) {

        return res.status(403).json({
          success: false,
          message:
            'Tidak punya izin menghapus dataset ini.'
        })

      }


      // -------------------------------------------------
      // HAPUS FILE
      // -------------------------------------------------

      const filePath =
        path.join(
          uploadDir,
          dataset.file_path
        )


      if (
        fs.existsSync(filePath)
      ) {

        try {

          fs.unlinkSync(
            filePath
          )

        } catch (fileError) {

          console.error(
            'GAGAL MENGHAPUS FILE DATASET:',
            fileError
          )

        }

      }


      // -------------------------------------------------
      // HAPUS DATASET DARI DATABASE
      // -------------------------------------------------

      const result =
        await db
          .prepare(`
            DELETE FROM datasets
            WHERE id = $1
          `)
          .run(id)


      if (
        result.changes === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            'Dataset tidak ditemukan.'
        })

      }


      return res.json({
        success: true,
        message:
          'Dataset berhasil dihapus.'
      })

    } catch (error) {

      console.error(
        'DELETE DATASET ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal menghapus dataset.'
      })

    }

  }
)


// =====================================================
// EXPORT
// =====================================================

module.exports = router
