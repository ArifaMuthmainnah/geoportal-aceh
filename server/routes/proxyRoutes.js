const express = require('express')

const db = require('../config/database')

const {
  authenticateToken,
  requireAdmin
} = require('../middleware/authMiddleware')

const router = express.Router()


// =====================================================
// OLD API BASE URL
// =====================================================

const OLD_API_BASE_URL =
  process.env.OLD_API_BASE_URL ||
  'https://sig.acehprov.go.id/api/v2'


// =====================================================
// HELPER: FETCH OLD API
// =====================================================

async function fetchOldApi(path) {

  const url = `${OLD_API_BASE_URL}${path}`

  const response = await fetch(url)

  if (!response.ok) {

    throw new Error(
      `Old API error: ${response.status}`
    )

  }

  return response.json()

}


// =====================================================
// HELPER: AMBIL OVERRIDES
// =====================================================

async function getOverridesMap(resourceType) {

  const rows =
    await db
      .prepare(`
        SELECT *
        FROM api_overrides
        WHERE resource_type = $1
      `)
      .all(resourceType)

  const map = new Map()

  rows.forEach((row) => {
    map.set(String(row.external_id), row)
  })

  return map

}


// =====================================================
// HELPER: TERAPKAN OVERRIDES KE LIST
// =====================================================

function applyOverridesToList(items, overridesMap) {

  if (!Array.isArray(items)) {
    return items
  }

  return items

    .filter((item) => {

      const key =
        String(item.pk ?? item.id ?? '')

      const override =
        overridesMap.get(key)

      return !(override && override.is_hidden)

    })

    .map((item) => {

      const key =
        String(item.pk ?? item.id ?? '')

      const override =
        overridesMap.get(key)

      if (!override) {
        return item
      }

      return {

        ...item,

        title:
          override.title_override ||
          item.title,

        abstract:
          override.abstract_override ||
          item.abstract,

        category:
          override.category_override
            ? {
                ...item.category,
                identifier:
                  override.category_override,
              }
            : item.category,

        _hasOverride: true,

      }

    })

}


// =====================================================
// HELPER: TERAPKAN OVERRIDE KE SATU ITEM
// =====================================================

function applyOverrideToItem(item, override) {

  if (!override) {
    return item
  }

  return {

    ...item,

    title:
      override.title_override ||
      item.title,

    abstract:
      override.abstract_override ||
      item.abstract,

    category:
      override.category_override
        ? {
            ...item.category,
            identifier:
              override.category_override,
          }
        : item.category,

    _hasOverride: true,

  }

}


// =====================================================
// DATASETS - LIST
// =====================================================

router.get('/datasets', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/datasets${query ? '?' + query : ''}`
      )

    const overridesMap =
      await getOverridesMap('dataset')

    const results =
      applyOverridesToList(
        data.results ||
        data.datasets ||
        [],
        overridesMap
      )

    // PENTING: timpa juga field ASLI-nya (datasets), bukan
    // cuma menambahkan field "results". Kalau tidak, halaman
    // yang membaca response.datasets akan tetap dapat data
    // mentah yang belum difilter override.
    const responseBody = { ...data, results }
    if (data.datasets !== undefined) responseBody.datasets = results

    return res.json(responseBody)

  } catch (error) {

    console.error(
      'PROXY DATASETS ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil data dari API Geoportal Aceh lama.',
    })

  }

})


// =====================================================
// DATASETS - DETAIL
// =====================================================

router.get('/datasets/:id', async (req, res) => {

  try {

    const overridesMap =
      await getOverridesMap('dataset')

    const override =
      overridesMap.get(String(req.params.id))

    if (override && override.is_hidden) {

      return res.status(404).json({
        success: false,
        message:
          'Data tidak ditemukan.',
      })

    }

    const data =
      await fetchOldApi(
        `/datasets/${req.params.id}`
      )

    const dataset =
      applyOverrideToItem(
        data.dataset || data,
        override
      )

    return res.json({
      ...data,
      dataset,
    })

  } catch (error) {

    console.error(
      'PROXY DATASET DETAIL ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil detail dari API Geoportal Aceh lama.',
    })

  }

})


// =====================================================
// GEOAPPS - LIST
// =====================================================

router.get('/geoapps', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/geoapps${query ? '?' + query : ''}`
      )

    const overridesMap =
      await getOverridesMap('geoapp')

    const results =
      applyOverridesToList(
        data.results ||
        data.geoapps ||
        [],
        overridesMap
      )

    const responseBody = { ...data, results }
    if (data.geoapps !== undefined) responseBody.geoapps = results

    return res.json(responseBody)

  } catch (error) {

    console.error(
      'PROXY GEOAPPS ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil aplikasi dari API Geoportal Aceh lama.',
    })

  }

})


// =====================================================
// GEOAPPS - DETAIL
// =====================================================

router.get('/geoapps/:id', async (req, res) => {

  try {

    const overridesMap =
      await getOverridesMap('geoapp')

    const override =
      overridesMap.get(String(req.params.id))

    if (override && override.is_hidden) {

      return res.status(404).json({
        success: false,
        message:
          'Data tidak ditemukan.',
      })

    }

    const data =
      await fetchOldApi(
        `/geoapps/${req.params.id}`
      )

    const geoapp =
      applyOverrideToItem(
        data.geoapp || data,
        override
      )

    return res.json({
      ...data,
      ...geoapp,
    })

  } catch (error) {

    console.error(
      'PROXY GEOAPP DETAIL ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil detail aplikasi dari API lama.',
    })

  }

})


// =====================================================
// OWNERS
// =====================================================

router.get('/owners', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/owners${query ? '?' + query : ''}`
      )

    return res.json(data)

  } catch (error) {

    console.error(
      'PROXY OWNERS ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil data instansi dari API lama.',
    })

  }

})


// =====================================================
// MAPS
// =====================================================

router.get('/maps', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/maps${query ? '?' + query : ''}`
      )

    return res.json(data)

  } catch (error) {

    console.error(
      'PROXY MAPS ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil data peta dari API lama.',
    })

  }

})


// =====================================================
// DOCUMENTS
// =====================================================

router.get('/documents', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/documents${query ? '?' + query : ''}`
      )

    return res.json(data)

  } catch (error) {

    console.error(
      'PROXY DOCUMENTS ERROR:',
      error.message
    )

    return res.status(502).json({
      success: false,
      message:
        'Gagal mengambil dokumen dari API lama.',
    })

  }

})

// =====================================================
// MAPS - DETAIL
// =====================================================

router.get('/maps/:id', async (req, res) => {

  try {

    const data = await fetchOldApi(`/maps/${req.params.id}`)

    return res.json(data)

  } catch (error) {

    console.error('PROXY MAP DETAIL ERROR:', error.message)

    return res.status(502).json({
      success: false,
      message: 'Gagal mengambil detail peta dari API lama.',
    })

  }

})

// =====================================================
// DOCUMENTS - DETAIL
// =====================================================

router.get('/documents/:id', async (req, res) => {

  try {

    const data = await fetchOldApi(`/documents/${req.params.id}`)

    return res.json(data)

  } catch (error) {

    console.error('PROXY DOCUMENT DETAIL ERROR:', error.message)

    return res.status(502).json({
      success: false,
      message: 'Gagal mengambil detail dokumen dari API lama.',
    })

  }

})

// =====================================================
// DATASETS - LIST UNTUK ADMIN (TERMASUK YANG DISEMBUNYIKAN)
// =====================================================
//
// Beda dengan /datasets (publik): endpoint ini tidak
// menyaring data is_hidden, supaya admin tetap bisa
// melihat & mengelola data yang sudah di-unpublish.
//
// =====================================================

router.get(
  '/admin/datasets',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

    const query =
        req.originalUrl.split('?')[1] || ''

      const data =
        await fetchOldApi(
          `/datasets${query ? '?' + query : ''}`
        )

      const overridesMap =
        await getOverridesMap('dataset')

      const results =
        (data.results || data.datasets || []).map((item) => {

          const key = String(item.pk ?? item.id ?? '')
          const override = overridesMap.get(key)

          if (!override) {
            return { ...item, _is_hidden: false }
          }

          return {
            ...applyOverrideToItem(item, override),
            _is_hidden: Boolean(override.is_hidden),
          }

        })

      return res.json({
        ...data,
        results,
      })

    } catch (error) {

      console.error('PROXY ADMIN DATASETS ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil data dari API Geoportal Aceh lama.',
      })

    }

  }
)


// =====================================================
// GEOAPPS - LIST UNTUK ADMIN (TERMASUK YANG DISEMBUNYIKAN)
// =====================================================

router.get(
  '/admin/geoapps',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {
        
      const query =
        req.originalUrl.split('?')[1] || ''

      const data =
        await fetchOldApi(
          `/geoapps${query ? '?' + query : ''}`
        )

      const overridesMap =
        await getOverridesMap('geoapp')

      const results =
        (data.results || data.geoapps || []).map((item) => {

          const key = String(item.pk ?? item.id ?? '')
          const override = overridesMap.get(key)

          if (!override) {
            return { ...item, _is_hidden: false }
          }

          return {
            ...applyOverrideToItem(item, override),
            _is_hidden: Boolean(override.is_hidden),
          }

        })

      return res.json({
        ...data,
        results,
      })

    } catch (error) {

      console.error('PROXY ADMIN GEOAPPS ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil aplikasi dari API Geoportal Aceh lama.',
      })

    }

  }
)

// =====================================================
// OVERRIDES - HANYA ADMIN
// =====================================================

router.use(
  '/overrides',
  authenticateToken,
  requireAdmin
)


// =====================================================
// OVERRIDES - UPSERT (sembunyikan / edit tampilan)
// =====================================================

router.post('/overrides', async (req, res) => {

  try {

    const {
      resource_type,
      external_id,
      is_hidden,
      title_override,
      abstract_override,
      category_override,
    } = req.body

    if (!resource_type || !external_id) {

      return res.status(400).json({
        success: false,
        message: 'resource_type dan external_id wajib diisi.',
      })

    }

    if (!['dataset', 'geoapp'].includes(resource_type)) {

      return res.status(400).json({
        success: false,
        message: 'resource_type tidak valid.',
      })

    }

    // ---------------------------------------------------
    // PENTING (#9): kalau is_hidden TIDAK dikirim (mis. saat
    // hanya mengedit title/abstract), JANGAN reset status
    // sembunyi ke 0. Ambil dulu nilai lama dari database dan
    // pertahankan, supaya edit metadata tidak diam-diam
    // "mempublikasikan ulang" data yang sudah di-unpublish.
    // ---------------------------------------------------

    const existing =
      await db
        .prepare(`
          SELECT is_hidden
          FROM api_overrides
          WHERE resource_type = $1 AND external_id = $2
        `)
        .get(resource_type, String(external_id))

    const nextIsHidden =
      is_hidden !== undefined
        ? (is_hidden ? 1 : 0)
        : (existing ? existing.is_hidden : 0)

    await db
      .prepare(`
        INSERT INTO api_overrides
        (resource_type, external_id, is_hidden, title_override, abstract_override, category_override, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (resource_type, external_id)
        DO UPDATE SET
          is_hidden = EXCLUDED.is_hidden,
          title_override = EXCLUDED.title_override,
          abstract_override = EXCLUDED.abstract_override,
          category_override = EXCLUDED.category_override,
          updated_at = CURRENT_TIMESTAMP
      `)
      .run(
        resource_type,
        String(external_id),
        nextIsHidden,
        title_override || null,
        abstract_override || null,
        category_override || null
      )

    return res.json({
      success: true,
      message: 'Penyesuaian data berhasil disimpan.',
    })

  } catch (error) {

    console.error('UPSERT OVERRIDE ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan penyesuaian data.',
    })

  }

})


// =====================================================
// OVERRIDES - LIST (untuk ditampilkan di admin)
// =====================================================

router.get('/overrides', async (req, res) => {

  try {

    const overrides =
      await db
        .prepare(`
          SELECT *
          FROM api_overrides
          ORDER BY updated_at DESC
        `)
        .all()

    return res.json({
      success: true,
      overrides,
    })

  } catch (error) {

    console.error(
      'GET OVERRIDES ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Gagal mengambil daftar penyesuaian.',
    })

  }

})


// =====================================================
// OVERRIDES - HAPUS (kembalikan ke tampilan asli)
// =====================================================

router.delete(
  '/overrides/:resourceType/:externalId',
  async (req, res) => {

    try {

      const {
        resourceType,
        externalId,
      } = req.params

      await db
        .prepare(`
          DELETE FROM api_overrides
          WHERE resource_type = $1
          AND external_id = $2
        `)
        .run(
          resourceType,
          externalId
        )

      return res.json({
        success: true,
        message:
          'Data dikembalikan ke tampilan asli.',
      })

    } catch (error) {

      console.error(
        'DELETE OVERRIDE ERROR:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Gagal menghapus penyesuaian.',
      })

    }

  }
)


module.exports = router