const jwt = require('jsonwebtoken'); // library to create and verify jwt tokens
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// fallback secret if env var not set (should always be set in production)
const JWT_SECRET = process.env.JWT_SECRET || 'amazon-clone-super-secret-key-2026';

// block requests that don't have a valid jwt
const authMiddleware = async (req, res, next) => {
  try {
    // pull bearer token from auth header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // "Bearer abc123..." — split and grab the token part after "Bearer "
    const token = authHeader.replace('Bearer ', '');

    // jwt.verify decodes the token and throws if expired or tampered
    const decoded = jwt.verify(token, JWT_SECRET);

    // make sure user still exists in db
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found, authorization denied' });
    }

    // attach user so downstream routes can use req.user
    req.user = user;
    next(); // pass control to the next middleware or route handler
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
