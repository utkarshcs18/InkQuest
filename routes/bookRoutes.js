const express = require('express');
const { searchBooks, getBookDetails } = require('../controller/bookController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/books/search?query=...
router.get('/search', requireAuth, searchBooks);

// GET /api/books/:id
router.get('/:id', getBookDetails);

module.exports = router;
