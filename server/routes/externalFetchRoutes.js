const express = require('express')
const dns = require('dns').promises
const net = require('net')

const { authenticateToken } = require('../middleware/authMiddleware')

const router = express.Router()

const FETCH_TIMEOUT_MS = 10000
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024 // 5 MB

function isPrivateIp(ip) {

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts[0] === 10) return true
    if (parts[0] === 127) return true
    if (parts[0] === 169 && parts[1] === 254) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 0) return true
    return false
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower === '::1') return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('fe80')) return true
    return false
  }

  return false

}

async function assertSafeExternalUrl(urlString) {

  let parsed

  try {
    parsed = new URL(urlString)
  } catch {
    throw new Error('URL tidak valid.')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL harus menggunakan http atau https.')
  }

  const hostname = parsed.hostname

  if (!hostname || hostname === 'localhost' || hostname === '0.0.0.0') {
    throw new Error('URL tidak diizinkan.')
  }

  let addresses

  try {
    addresses = await dns.lookup(hostname, { all: true })
  } catch {
    throw new Error('Gagal menemukan alamat dari URL tersebut. Pastikan URL benar.')
  }

  addresses.forEach((addr) => {
    if (isPrivateIp(addr.address)) {
      throw new Error('URL mengarah ke alamat jaringan internal, tidak diizinkan.')
    }
  })

  return parsed

}

router.use(authenticateToken)

router.post('/fetch', async (req, res) => {

  try {

    const { url } = req.body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, message: 'URL endpoint wajib diisi.' })
    }

    let parsedUrl

    try {
      parsedUrl = await assertSafeExternalUrl(url.trim())
    } catch (safetyError) {
      return res.status(400).json({ success: false, message: safetyError.message })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response

    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
    } catch (fetchError) {
      return res.status(502).json({ success: false, message: 'Gagal menghubungi URL tersebut (timeout atau tidak dapat diakses).' })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      return res.status(502).json({ success: false, message: `URL merespons dengan status ${response.status}.` })
    }

    const contentLength = Number(response.headers.get('content-length') || 0)

    if (contentLength > MAX_RESPONSE_BYTES) {
      return res.status(413).json({ success: false, message: 'Respons dari URL terlalu besar.' })
    }

    const text = await response.text()

    if (text.length > MAX_RESPONSE_BYTES) {
      return res.status(413).json({ success: false, message: 'Respons dari URL terlalu besar.' })
    }

    let json

    try {
      json = JSON.parse(text)
    } catch {
      return res.status(422).json({ success: false, message: 'Respons dari URL bukan format JSON yang valid.' })
    }

    return res.json({ success: true, data: json })

  } catch (error) {

    console.error('EXTERNAL FETCH ERROR:', error)

    return res.status(500).json({ success: false, message: 'Gagal mengambil data dari API eksternal.' })

  }

})

module.exports = router