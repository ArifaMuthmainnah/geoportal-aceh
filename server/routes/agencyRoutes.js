const express = require('express')

const db = require('../config/database')

const {
  authenticateToken,
  requireAdmin
} = require('../middleware/authMiddleware')

const router = express.Router()


// =====================================================
// GET PROFIL INSTANSI (PUBLIK)
// =====================================================
//
// #10: dipakai halaman detail JIGN (/jign/:username) untuk
// menampilkan deskripsi + link website resmi instansi.
// Data ini TIDAK berasal dari API Geoportal Aceh lama
// (memang tidak tersedia di sana), jadi disimpan & dikelola
// sendiri di tabel agency_profiles.
//
// =====================================================

router.get('/:username', async (req, res) => {

  try {

    const username = String(req.params.username || '').trim()

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username tidak valid.' })
    }

    const profile =
      await db.prepare(`
        SELECT username, description, website_url, updated_at
        FROM agency_profiles
        WHERE LOWER(username) = LOWER($1)
      `).get(username)

    return res.json({ success: true, profile: profile || null })

  } catch (error) {

    console.error('GET AGENCY PROFILE ERROR:', error)

    return res.status(500).json({ success: false, message: 'Gagal mengambil profil instansi.' })

  }

})


// =====================================================
// SEMUA ROUTE DI BAWAH INI WAJIB ADMIN
// =====================================================

router.use(
  authenticateToken,
  requireAdmin
)


// =====================================================
// SIMPAN / PERBARUI PROFIL INSTANSI (ADMIN ONLY)
// =====================================================

router.patch('/:username', async (req, res) => {

  try {

    const username = String(req.params.username || '').trim()

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username tidak valid.' })
    }

    const { description, website_url } = req.body

    const cleanDescription =
      description !== undefined ? String(description).trim() : ''

    const cleanWebsite =
      website_url !== undefined ? String(website_url).trim() : ''

    if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
      return res.status(400).json({
        success: false,
        message: 'Link website harus diawali dengan http:// atau https://'
      })
    }

    const existing =
      await db.prepare(`
        SELECT id FROM agency_profiles WHERE LOWER(username) = LOWER($1)
      `).get(username)

    if (existing) {

      await db.prepare(`
        UPDATE agency_profiles
        SET description = $1, website_url = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `).run(cleanDescription, cleanWebsite || null, existing.id)

    } else {

      await db.prepare(`
        INSERT INTO agency_profiles (username, description, website_url)
        VALUES ($1, $2, $3)
      `).run(username, cleanDescription, cleanWebsite || null)

    }

    return res.json({
      success: true,
      message: 'Profil instansi berhasil disimpan.',
      profile: {
        username,
        description: cleanDescription,
        website_url: cleanWebsite || null
      }
    })

  } catch (error) {

    console.error('SAVE AGENCY PROFILE ERROR:', error)

    return res.status(500).json({ success: false, message: 'Gagal menyimpan profil instansi.' })

  }

})


module.exports = router