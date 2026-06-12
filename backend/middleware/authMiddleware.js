// middleware/authMiddleware.js
// This middleware runs BEFORE any protected route handler.
// It checks the Authorization header for a valid JWT token.
// If valid, it adds req.userId so controllers know who is making the request.

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // The token is sent in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1]; // Extract token after "Bearer "

  try {
    // jwt.verify throws an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach userId to every request
    next(); // Pass control to the actual route handler
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = authMiddleware;
