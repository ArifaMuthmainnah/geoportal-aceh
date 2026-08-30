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


const uploadDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({ storage })


function deleteFileByName(filename) {
  if (!filename) return
  const filePath = path.join(uploadDir, filename)
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath) } catch (error) { console.error('GAGAL MENGHAPUS FILE:', error) }
  }
}

function deleteUploadedFiles(files) {
  if (!Array.isArray(files)) return
  files.forEach((file) => deleteFileByName(file.filename))
}

function deleteDatasetFiles(dataset) {
  if (dataset.files_json) {
    try {
      const filesList = JSON.parse(dataset.files_json)
      if (Array.isArray(filesList)) {
        filesList.forEach((f) => deleteFileByName(f.file_path))
        return
      }
    } catch {}
  }
  if (dataset.file_path) deleteFileByName(dataset.file_path)
}


// =====================================================
// DATASET PUBLIK
// =====================================================

router.get('/published', async (req, res) => {
  try {
    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.is_published = 1
        ORDER BY d.created_at DESC
      `).all()
    return res.json({ success: true, datasets })
  } catch (error) {
    console.error('GET PUBLISHED DATASETS ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil dataset publik.' })
  }
})


router.get('/public/:resourceType', async (req, res) => {
  try {
    const resourceType = String(req.params.resourceType).trim().toLowerCase()
    const allowedTypes = ['dataset', 'dashboard', 'webgis']

    if (!allowedTypes.includes(resourceType)) {
      return res.status(400).json({ success: false, message: 'Resource type tidak valid.' })
    }

    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.is_published = 1 AND LOWER(d.resource_type) = $1
        ORDER BY d.created_at DESC
      `).all(resourceType)

    return res.json({ success: true, resource_type: resourceType, datasets })
  } catch (error) {
    console.error('GET PUBLIC RESOURCE TYPE ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data resource.' })
  }
})


router.get('/public/detail/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID data tidak valid.' })

    const dataset =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.id = $1 AND d.is_published = 1
      `).get(id)

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau belum dipublikasikan.' })
    }

    return res.json({ success: true, dataset })
  } catch (error) {
    console.error('GET PUBLIC DETAIL ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail data.' })
  }
})


router.use(authenticateToken)


router.get('/mine/detail/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID data tidak valid.' })

    const dataset =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.id = $1
      `).get(id)

    if (!dataset) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })

    const isOwner = Number(dataset.owner_id) === Number(req.user.id)
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Tidak punya izin melihat data ini.' })

    return res.json({ success: true, dataset })
  } catch (error) {
    console.error('GET MINE DETAIL ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail data.' })
  }
})


router.get('/admin/detail/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID data tidak valid.' })

    const dataset =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.id = $1
      `).get(id)

    if (!dataset) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })

    return res.json({ success: true, dataset })
  } catch (error) {
    console.error('GET ADMIN DETAIL ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail data.' })
  }
})


// =====================================================
// UPLOAD RESOURCE
// =====================================================
//
// #4: file dan link SEKARANG BOLEH DIISI BERSAMAAN,
// tidak lagi harus pilih salah satu. content_type
// dihitung otomatis: 'file' | 'link' | 'both'.
// Minimal salah satu (file ATAU link) wajib diisi.
//
// =====================================================

router.post('/', upload.array('base_file', 10), async (req, res) => {

  try {

    const {
      title, abstract, resource_type, category, keywords,
      external_url, extra_metadata
    } = req.body

    const files = req.files || []
    const hasExternalUrl = Boolean(external_url && external_url.trim())
    const hasFiles = files.length > 0

    if (!title || !title.trim()) {
      deleteUploadedFiles(files)
      return res.status(400).json({ success: false, message: 'Judul wajib diisi.' })
    }

    const normalizedResourceType = String(resource_type || 'dataset').trim().toLowerCase()
    const allowedTypes = ['dataset', 'dashboard', 'webgis']

    if (!allowedTypes.includes(normalizedResourceType)) {
      deleteUploadedFiles(files)
      return res.status(400).json({ success: false, message: 'Jenis resource tidak valid.' })
    }

    if (!hasFiles && !hasExternalUrl) {
      return res.status(400).json({ success: false, message: 'Isi minimal salah satu: file atau link.' })
    }

    const normalizedContentType =
      hasFiles && hasExternalUrl ? 'both' : (hasFiles ? 'file' : 'link')

    const filesJson =
      hasFiles
        ? JSON.stringify(files.map((f) => ({ file_path: f.filename, file_name: f.originalname })))
        : null

    const result =
      await db.prepare(`
        INSERT INTO datasets
        (title, abstract, resource_type, category, keywords, file_path, file_name,
         owner_id, is_published, content_type, external_url, extra_metadata, files_json)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,$11,$12)
        RETURNING id
      `).run(
        title.trim(),
        abstract || '',
        normalizedResourceType,
        category || '',
        keywords || '',
        hasFiles ? files[0].filename : null,
        hasFiles ? files[0].originalname : null,
        req.user.id,
        normalizedContentType,
        hasExternalUrl ? external_url.trim() : null,
        extra_metadata || null,
        filesJson
      )

    return res.status(201).json({
      success: true,
      message: 'Data berhasil diunggah dan menunggu review admin.',
      dataset: { id: result.lastInsertRowid }
    })

  } catch (error) {
    console.error('UPLOAD RESOURCE ERROR:', error)
    deleteUploadedFiles(req.files)
    return res.status(500).json({ success: false, message: 'Gagal mengunggah data.' })
  }

})


router.get('/mine', async (req, res) => {
  try {
    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.owner_id = $1 ORDER BY d.created_at DESC
      `).all(req.user.id)
    return res.json({ success: true, datasets })
  } catch (error) {
    console.error('GET MY DATASETS ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data milik saya.' })
  }
})


router.get('/mine/:resourceType', async (req, res) => {
  try {
    const resourceType = String(req.params.resourceType).trim().toLowerCase()
    const allowedTypes = ['dataset', 'dashboard', 'webgis']
    if (!allowedTypes.includes(resourceType)) return res.status(400).json({ success: false, message: 'Resource type tidak valid.' })

    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.owner_id = $1 AND LOWER(d.resource_type) = $2
        ORDER BY d.created_at DESC
      `).all(req.user.id, resourceType)

    return res.json({ success: true, resource_type: resourceType, datasets })
  } catch (error) {
    console.error('GET MY RESOURCE TYPE ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil resource.' })
  }
})


router.get('/', requireAdmin, async (req, res) => {
  try {
    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        ORDER BY d.created_at DESC
      `).all()
    return res.json({ success: true, datasets })
  } catch (error) {
    console.error('GET ALL DATASETS ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil semua data.' })
  }
})


router.get('/admin/:resourceType', requireAdmin, async (req, res) => {
  try {
    const resourceType = String(req.params.resourceType).trim().toLowerCase()
    const allowedTypes = ['dataset', 'dashboard', 'webgis']
    if (!allowedTypes.includes(resourceType)) return res.status(400).json({ success: false, message: 'Resource type tidak valid.' })

    const datasets =
      await db.prepare(`
        SELECT d.*, u.username AS owner_username, u.avatar_url AS owner_avatar_url
        FROM datasets d LEFT JOIN users u ON u.id = d.owner_id
        WHERE LOWER(d.resource_type) = $1
        ORDER BY d.created_at DESC
      `).all(resourceType)

    return res.json({ success: true, resource_type: resourceType, datasets })
  } catch (error) {
    console.error('GET ADMIN RESOURCE TYPE ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data resource.' })
  }
})


// =====================================================
// EDIT / PUBLISH RESOURCE
// =====================================================

router.patch('/:id', async (req, res) => {

  try {

    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID data tidak valid.' })

    const dataset = await db.prepare(`SELECT * FROM datasets WHERE id = $1`).get(id)
    if (!dataset) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })

    const isOwner = Number(dataset.owner_id) === Number(req.user.id)
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Tidak punya izin mengubah data ini.' })

    if (isOwner && !isAdmin && dataset.is_published) {
      return res.status(403).json({
        success: false,
        message: 'Data sudah dipublikasikan, tidak dapat diedit lagi. Hubungi admin untuk perubahan.'
      })
    }

    const {
      title, abstract, resource_type, category, keywords,
      is_published, external_url, extra_metadata, remove_link
    } = req.body

    const nextTitle = title !== undefined ? String(title).trim() : dataset.title
    const nextAbstract = abstract !== undefined ? abstract : dataset.abstract
    const nextCategory = category !== undefined ? category : dataset.category
    const nextKeywords = keywords !== undefined ? keywords : dataset.keywords
    const nextExtraMetadata = extra_metadata !== undefined ? extra_metadata : dataset.extra_metadata

    const nextExternalUrl =
      remove_link ? null : (external_url !== undefined ? external_url : dataset.external_url)

    const hasFiles = Boolean(dataset.file_path || dataset.files_json)
    const hasLink = Boolean(nextExternalUrl && String(nextExternalUrl).trim())

    const nextContentType =
      hasFiles && hasLink ? 'both' : (hasFiles ? 'file' : (hasLink ? 'link' : dataset.content_type))

    let nextResourceType = dataset.resource_type || 'dataset'
    if (isAdmin && resource_type !== undefined) {
      nextResourceType = String(resource_type).trim().toLowerCase()
    }

    const allowedTypes = ['dataset', 'dashboard', 'webgis']
    if (!allowedTypes.includes(nextResourceType)) {
      return res.status(400).json({ success: false, message: 'Resource type tidak valid.' })
    }

    const nextPublished =
      isAdmin && is_published !== undefined ? (is_published ? 1 : 0) : dataset.is_published

    await db.prepare(`
      UPDATE datasets
      SET title=$1, abstract=$2, resource_type=$3, category=$4, keywords=$5,
          is_published=$6, content_type=$7, external_url=$8, extra_metadata=$9
      WHERE id=$10
    `).run(
      nextTitle, nextAbstract, nextResourceType, nextCategory, nextKeywords,
      nextPublished, nextContentType, nextExternalUrl, nextExtraMetadata, id
    )

    return res.json({ success: true, message: 'Data berhasil diperbarui.' })

  } catch (error) {
    console.error('UPDATE RESOURCE ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data.' })
  }

})


// =====================================================
// HAPUS RESOURCE — #3: HANYA ADMIN, OPERATOR SAMA SEKALI
// TIDAK BOLEH HAPUS (baik published maupun belum)
// =====================================================

router.delete('/:id', requireAdmin, async (req, res) => {

  try {

    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID data tidak valid.' })

    const dataset = await db.prepare(`SELECT * FROM datasets WHERE id = $1`).get(id)
    if (!dataset) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })

    deleteDatasetFiles(dataset)

    const result = await db.prepare(`DELETE FROM datasets WHERE id = $1`).run(id)

    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })

    return res.json({ success: true, message: 'Data berhasil dihapus.' })

  } catch (error) {
    console.error('DELETE RESOURCE ERROR:', error)
    return res.status(500).json({ success: false, message: 'Gagal menghapus data.' })
  }

})


module.exports = router