require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

require('./config/database')

const authRoutes =
  require('./routes/authRoutes')

const userRoutes =
  require('./routes/userRoutes')

const datasetRoutes =
  require('./routes/datasetRoutes')

const proxyRoutes =
  require('./routes/proxyRoutes')


const app = express()


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: false
  })
)

app.use(
  express.json()
)

app.use(
  express.urlencoded({
    extended: true
  })
)


// =====================================================
// STATIC FILES
// =====================================================

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      'uploads'
    )
  )
)


// =====================================================
// ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
)

app.use(
  '/api/users',
  userRoutes
)

app.use(
  '/api/datasets',
  datasetRoutes
)

app.use(
  '/api/proxy',
  proxyRoutes
)

// =====================================================
// API INDEX (mirip gaya GeoNode /api/v2/)
// =====================================================

app.get('/api', (req, res) => {
  res.json({
    auth: 'auth',
    users: 'users',
    datasets: 'datasets',
    proxy: 'proxy (datasets, geoapps, owners, maps, documents dari API lama)',
  })
})

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      success: true,
      message:
        'Geoportal Aceh API berjalan.',
      time:
        new Date().toISOString()
    })

  }
)


// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      message:
        'Endpoint tidak ditemukan.'
    })

  }
)


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (error, req, res, next) => {

    console.error(error)

    res.status(500).json({
      success: false,
      message:
        'Terjadi kesalahan server.'
    })

  }
)


// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000


app.listen(
  PORT,
  () => {

    console.log('')

    console.log(
      '======================================'
    )

    console.log(
      '  GEOPORTAL ACEH BACKEND'
    )

    console.log(
      '======================================'
    )

    console.log(
      `  http://localhost:${PORT}`
    )

    console.log(
      `  http://localhost:${PORT}/api/health`
    )

    console.log(
      `  http://localhost:${PORT}/uploads`
    )

    console.log(
      '======================================'
    )

  }
)