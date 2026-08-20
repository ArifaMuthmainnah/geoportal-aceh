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

const uploadDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

// =====================================================
// DATASET PUBLIK (PUBLISHED) - UNTUK HOME & KATALOG
// =====================================================
//
// Endpoint ini TIDAK memerlukan login, karena
// dipakai oleh halaman publik (Home, Katalog).
//
// =====================================================

router.get('/published', (req, res) => {

  try {

    const datasets = db.prepare(`
      SELECT
        d.id,
        d.title,
        d.abstract,
        d.category,
        d.keywords,
        d.created_at,
        u.username AS owner_username
      FROM datasets d
      JOIN users u ON u.id = d.owner_id
      WHERE d.is_published = 1
      ORDER BY d.created_at DESC
    `).all()

    res.json({
      success: true,
      datasets
    })

  } catch (error) {

    console.error('GET PUBLISHED DATASETS ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil dataset publik.'
    })

  }

})


// =====================================================
// SEMUA ROUTE DI SINI WAJIB LOGIN
// =====================================================

router.use(authenticateToken)


// =====================================================
// UPLOAD DATASET
// =====================================================

router.post('/', upload.single('base_file'), (req, res) => {

  try {

    const { title, abstract, category, keywords } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File wajib diunggah.'
      })
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Judul dataset wajib diisi.'
      })
    }

    const result = db.prepare(`
      INSERT INTO datasets
      (title, abstract, category, keywords, file_path, file_name, owner_id, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      title,
      abstract || '',
      category || '',
      keywords || '',
      req.file.filename,
      req.file.originalname,
      req.user.id
    )

    res.status(201).json({
      success: true,
      message: 'Dataset berhasil diunggah, menunggu review admin.',
      dataset: {
        id: result.lastInsertRowid,
        title,
        abstract,
        category,
        keywords,
        owner_id: req.user.id,
        is_published: false
      }
    })

  } catch (error) {

    console.error('UPLOAD DATASET ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Gagal mengunggah dataset.'
    })

  }

})


// =====================================================
// DATASET SAYA (OPERATOR)
// =====================================================

router.get('/mine', (req, res) => {

  const datasets = db.prepare(`
    SELECT *
    FROM datasets
    WHERE owner_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id)

  res.json({
    success: true,
    datasets
  })

})


// =====================================================
// SEMUA DATASET (ADMIN ONLY)
// =====================================================

router.get('/', requireAdmin, (req, res) => {

  const datasets = db.prepare(`
    SELECT
      d.*,
      u.username AS owner_username
    FROM datasets d
    JOIN users u ON u.id = d.owner_id
    ORDER BY d.created_at DESC
  `).all()

  res.json({
    success: true,
    datasets
  })

})


// =====================================================
// EDIT / PUBLISH DATASET
// =====================================================
//
// Owner boleh edit dataset miliknya sendiri.
// Admin boleh edit dataset siapa saja + toggle publish.
//
// =====================================================

router.patch('/:id', (req, res) => {

  const id = Number(req.params.id)

  const dataset = db.prepare(`
    SELECT * FROM datasets WHERE id = ?
  `).get(id)

  if (!dataset) {
    return res.status(404).json({
      success: false,
      message: 'Dataset tidak ditemukan.'
    })
  }

  const isOwner = dataset.owner_id === req.user.id
  const isAdmin = req.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Tidak punya izin mengubah dataset ini.'
    })
  }

  const { title, abstract, is_published } = req.body

  const nextTitle = title !== undefined ? title : dataset.title
  const nextAbstract = abstract !== undefined ? abstract : dataset.abstract

  // Hanya admin yang boleh ubah status publish
  const nextPublished =
    isAdmin && is_published !== undefined
      ? (is_published ? 1 : 0)
      : dataset.is_published

  db.prepare(`
    UPDATE datasets
    SET title = ?, abstract = ?, is_published = ?
    WHERE id = ?
  `).run(nextTitle, nextAbstract, nextPublished, id)

  res.json({
    success: true,
    message: 'Dataset berhasil diperbarui.'
  })

})


// =====================================================
// HAPUS DATASET
// =====================================================

router.delete('/:id', (req, res) => {

  const id = Number(req.params.id)

  const dataset = db.prepare(`
    SELECT * FROM datasets WHERE id = ?
  `).get(id)

  if (!dataset) {
    return res.status(404).json({
      success: false,
      message: 'Dataset tidak ditemukan.'
    })
  }

  const isOwner = dataset.owner_id === req.user.id
  const isAdmin = req.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Tidak punya izin menghapus dataset ini.'
    })
  }

  const filePath = path.join(uploadDir, dataset.file_path)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  db.prepare(`DELETE FROM datasets WHERE id = ?`).run(id)

  res.json({
    success: true,
    message: 'Dataset berhasil dihapus.'
  })

})


module.exports = router