const express = require('express');
const { searchBooks, getBookDetails, getRecommendations } = require('../controller/bookController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/books/recommendations (Public)
router.get('/recommendations', getRecommendations);

// GET /api/books/search?query=... (Protected)
router.get('/search', requireAuth, searchBooks);

// GET /api/books/:id (Public)
router.get('/:id', getBookDetails);

module.exports = router;
