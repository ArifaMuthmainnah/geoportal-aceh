const express = require('express')
const db = require('../config/database')
const {
  authenticateToken,
  requireAdmin
} = require('../middleware/authMiddleware')

const router = express.Router()

const OLD_API_BASE_URL =
  process.env.OLD_API_BASE_URL ||
  'https://sig.acehprov.go.id/api/v2'

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

        keywords:
          override.keywords_override ||
          item.keywords,

        _hasOverride: true,

        _override_extra_metadata:
          override.extra_metadata_override || null,

      }

    })

}

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

    keywords:
      override.keywords_override ||
      item.keywords,

    _hasOverride: true,

    _override_extra_metadata:
      override.extra_metadata_override || null,

  }

}

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

router.get('/maps', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/maps${query ? '?' + query : ''}`
      )

    const overridesMap = await getOverridesMap('map')

    const results = applyOverridesToList(
      data.results || data.maps || [],
      overridesMap
    )

    const responseBody = { ...data, results }
    if (data.maps !== undefined) responseBody.maps = results

    return res.json(responseBody)

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

router.get('/documents', async (req, res) => {

  try {

    const query =
      req.originalUrl.split('?')[1] || ''

    const data =
      await fetchOldApi(
        `/documents${query ? '?' + query : ''}`
      )

    const overridesMap = await getOverridesMap('document')

    const results = applyOverridesToList(
      data.results || data.documents || [],
      overridesMap
    )

    const responseBody = { ...data, results }
    if (data.documents !== undefined) responseBody.documents = results

    return res.json(responseBody)

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

router.get('/maps/:id', async (req, res) => {

  try {

    const overridesMap = await getOverridesMap('map')
    const override = overridesMap.get(String(req.params.id))

    if (override && override.is_hidden) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })
    }

    const data = await fetchOldApi(`/maps/${req.params.id}`)

    const map = applyOverrideToItem(data.map || data, override)

    return res.json({ ...data, map })

  } catch (error) {

    console.error('PROXY MAP DETAIL ERROR:', error.message)

    return res.status(502).json({
      success: false,
      message: 'Gagal mengambil detail peta dari API lama.',
    })

  }

})

router.get('/documents/:id', async (req, res) => {

  try {

    const overridesMap = await getOverridesMap('document')
    const override = overridesMap.get(String(req.params.id))

    if (override && override.is_hidden) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' })
    }

    const data = await fetchOldApi(`/documents/${req.params.id}`)

    const document = applyOverrideToItem(data.document || data, override)

    return res.json({ ...data, document })

  } catch (error) {

    console.error('PROXY DOCUMENT DETAIL ERROR:', error.message)

    return res.status(502).json({
      success: false,
      message: 'Gagal mengambil detail dokumen dari API lama.',
    })

  }

})

router.get(
  '/admin/maps',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const query = req.originalUrl.split('?')[1] || ''

      const data = await fetchOldApi(`/maps${query ? '?' + query : ''}`)

      const overridesMap = await getOverridesMap('map')

      const results = (data.results || data.maps || []).map((item) => {
        const key = String(item.pk ?? item.id ?? '')
        const override = overridesMap.get(key)
        if (!override) return { ...item, _is_hidden: false }
        return { ...applyOverrideToItem(item, override), _is_hidden: Boolean(override.is_hidden) }
      })

      return res.json({ ...data, results })

    } catch (error) {

      console.error('PROXY ADMIN MAPS ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil data peta dari API Geoportal Aceh lama.',
      })

    }

  }
)

router.get(
  '/admin/maps/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const overridesMap = await getOverridesMap('map')
      const override = overridesMap.get(String(req.params.id))

      const data = await fetchOldApi(`/maps/${req.params.id}`)
      const raw = data.map || data

      const merged = applyOverrideToItem(raw, override)

      return res.json({
        ...data,
        map: { ...merged, _is_hidden: Boolean(override?.is_hidden) },
      })

    } catch (error) {

      console.error('PROXY ADMIN MAP DETAIL ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil detail peta dari API Geoportal Aceh lama.',
      })

    }

  }
)

router.get(
  '/admin/documents',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const query = req.originalUrl.split('?')[1] || ''

      const data = await fetchOldApi(`/documents${query ? '?' + query : ''}`)

      const overridesMap = await getOverridesMap('document')

      const results = (data.results || data.documents || []).map((item) => {
        const key = String(item.pk ?? item.id ?? '')
        const override = overridesMap.get(key)
        if (!override) return { ...item, _is_hidden: false }
        return { ...applyOverrideToItem(item, override), _is_hidden: Boolean(override.is_hidden) }
      })

      return res.json({ ...data, results })

    } catch (error) {

      console.error('PROXY ADMIN DOCUMENTS ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil dokumen dari API Geoportal Aceh lama.',
      })

    }

  }
)

router.get(
  '/admin/documents/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const overridesMap = await getOverridesMap('document')
      const override = overridesMap.get(String(req.params.id))

      const data = await fetchOldApi(`/documents/${req.params.id}`)
      const raw = data.document || data

      const merged = applyOverrideToItem(raw, override)

      return res.json({
        ...data,
        document: { ...merged, _is_hidden: Boolean(override?.is_hidden) },
      })

    } catch (error) {

      console.error('PROXY ADMIN DOCUMENT DETAIL ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil detail dokumen dari API Geoportal Aceh lama.',
      })

    }

  }
)

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

router.get(
  '/admin/datasets/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const overridesMap =
        await getOverridesMap('dataset')

      const override =
        overridesMap.get(String(req.params.id))

      const data =
        await fetchOldApi(
          `/datasets/${req.params.id}`
        )

      const raw = data.dataset || data

      const merged =
        applyOverrideToItem(raw, override)

      return res.json({
        ...data,
        dataset: {
          ...merged,
          _is_hidden: Boolean(override?.is_hidden),
        },
      })

    } catch (error) {

      console.error('PROXY ADMIN DATASET DETAIL ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil detail dataset dari API Geoportal Aceh lama.',
      })

    }

  }
)

router.get(
  '/admin/geoapps/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const overridesMap =
        await getOverridesMap('geoapp')

      const override =
        overridesMap.get(String(req.params.id))

      const data =
        await fetchOldApi(
          `/geoapps/${req.params.id}`
        )

      const raw = data.geoapp || data

      const merged =
        applyOverrideToItem(raw, override)

      return res.json({
        ...data,
        ...merged,
        _is_hidden: Boolean(override?.is_hidden),
      })

    } catch (error) {

      console.error('PROXY ADMIN GEOAPP DETAIL ERROR:', error.message)

      return res.status(502).json({
        success: false,
        message: 'Gagal mengambil detail aplikasi dari API Geoportal Aceh lama.',
      })

    }

  }
)

router.use(
  '/attribute-data',
  authenticateToken,
  requireAdmin
)

router.get(
  '/attribute-data/:resourceType/:externalId',
  async (req, res) => {

    try {

      const { resourceType, externalId } = req.params

        if (!['dataset', 'geoapp', 'map', 'document'].includes(resource_type)) {

          return res.status(400).json({
            success: false,
            message: 'resource_type tidak valid.',
          })

        }

    const row =
        await db
          .prepare(`
            SELECT attribute_data_override
            FROM api_overrides
            WHERE resource_type = $1 AND external_id = $2
          `)
          .get(resourceType, String(externalId))

      return res.json({
        success: true,
        attribute_data: row?.attribute_data_override || null,
      })

    } catch (error) {

      console.error('GET ATTRIBUTE DATA OVERRIDE ERROR:', error)

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil isi atribut tersimpan.',
      })

    }

  }
)

router.post(
  '/attribute-data',
  async (req, res) => {

    try {

      const { resource_type, external_id, attribute_data } = req.body

      if (!resource_type || !external_id) {
        return res.status(400).json({
          success: false,
          message: 'resource_type dan external_id wajib diisi.',
        })
      }

    if (!['dataset', 'geoapp', 'map', 'document'].includes(resource_type)) {

      return res.status(400).json({
        success: false,
        message: 'resource_type tidak valid.',
      })

    }

      await db
        .prepare(`
          INSERT INTO api_overrides
          (resource_type, external_id, attribute_data_override, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (resource_type, external_id)
          DO UPDATE SET
            attribute_data_override = EXCLUDED.attribute_data_override,
            updated_at = CURRENT_TIMESTAMP
        `)
        .run(resource_type, String(external_id), attribute_data || null)

      return res.json({
        success: true,
        message: 'Isi atribut berhasil disimpan.',
      })

    } catch (error) {

      console.error('SAVE ATTRIBUTE DATA OVERRIDE ERROR:', error)

      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan isi atribut.',
      })

    }

  }
)

router.use(
  '/map-layers',
  authenticateToken,
  requireAdmin
)

router.get(
  '/map-layers/:resourceType/:externalId',
  async (req, res) => {

    try {

      const { resourceType, externalId } = req.params

      if (!['dataset', 'geoapp', 'map', 'document'].includes(resourceType)) {
        return res.status(400).json({ success: false, message: 'resource_type tidak valid.' })
      }

      const row =
        await db
          .prepare(`
            SELECT map_layers_override
            FROM api_overrides
            WHERE resource_type = $1 AND external_id = $2
          `)
          .get(resourceType, String(externalId))

      return res.json({
        success: true,
        map_layers: row?.map_layers_override || null,
      })

    } catch (error) {

      console.error('GET MAP LAYERS OVERRIDE ERROR:', error)

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil layer peta tersimpan.',
      })

    }

  }
)

router.post(
  '/map-layers',
  async (req, res) => {

    try {

      const { resource_type, external_id, map_layers } = req.body

      if (!resource_type || !external_id) {
        return res.status(400).json({
          success: false,
          message: 'resource_type dan external_id wajib diisi.',
        })
      }

      if (!['dataset', 'geoapp', 'map', 'document'].includes(resource_type)) {
        return res.status(400).json({ success: false, message: 'resource_type tidak valid.' })
      }

      await db
        .prepare(`
          INSERT INTO api_overrides
          (resource_type, external_id, map_layers_override, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (resource_type, external_id)
          DO UPDATE SET
            map_layers_override = EXCLUDED.map_layers_override,
            updated_at = CURRENT_TIMESTAMP
        `)
        .run(resource_type, String(external_id), map_layers || null)

      return res.json({
        success: true,
        message: 'Layer peta berhasil disimpan.',
      })

    } catch (error) {

      console.error('SAVE MAP LAYERS OVERRIDE ERROR:', error)

      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan layer peta.',
      })

    }

  }
)

router.use(
  '/overrides',
  authenticateToken,
  requireAdmin
)

router.post('/overrides', async (req, res) => {

  try {

    const {
      resource_type,
      external_id,
      is_hidden,
      title_override,
      abstract_override,
      category_override,
      keywords_override,
      extra_metadata_override,
    } = req.body

    if (!resource_type || !external_id) {

      return res.status(400).json({
        success: false,
        message: 'resource_type dan external_id wajib diisi.',
      })

    }

    if (!['dataset', 'geoapp', 'map', 'document'].includes(resource_type)) {

      return res.status(400).json({
        success: false,
        message: 'resource_type tidak valid.',
      })

    }

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
        (resource_type, external_id, is_hidden, title_override, abstract_override, category_override, keywords_override, extra_metadata_override, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (resource_type, external_id)
        DO UPDATE SET
          is_hidden = EXCLUDED.is_hidden,
          title_override = EXCLUDED.title_override,
          abstract_override = EXCLUDED.abstract_override,
          category_override = EXCLUDED.category_override,
          keywords_override = EXCLUDED.keywords_override,
          extra_metadata_override = EXCLUDED.extra_metadata_override,
          updated_at = CURRENT_TIMESTAMP
      `)
      .run(
        resource_type,
        String(external_id),
        nextIsHidden,
        title_override || null,
        abstract_override || null,
        category_override || null,
        keywords_override || null,
        extra_metadata_override || null
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