const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    // Get token from headers (Format: Bearer <token>)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token using secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inkquest_super_secret');
        req.user = decoded; // Attach user payload to request
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = { requireAuth };
