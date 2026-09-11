const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {

  const authHeader =
    req.headers.authorization

  if (!authHeader) {

    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan.'
    })

  }

  const parts =
    authHeader.split(' ')

  if (
    parts.length !== 2 ||
    parts[0] !== 'Bearer'
  ) {

    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid.'
    })

  }

  const token = parts[1]

  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      )

    req.user = decoded

    next()

  } catch (error) {

    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah expired.'
    })

  }

}

function requireAdmin(req, res, next) {

  if (!req.user) {

    return res.status(401).json({
      success: false,
      message: 'Belum login.'
    })

  }

  if (req.user.role !== 'admin') {

    return res.status(403).json({
      success: false,
      message: 'Akses hanya untuk admin.'
    })

  }

  next()

}

module.exports = {
  authenticateToken,
  requireAdmin
}