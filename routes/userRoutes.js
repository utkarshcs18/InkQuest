const express = require('express');
const { likeBook, unlikeBook, getLikedBooks } = require('../controller/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.post('/like', likeBook);
router.post('/unlike', unlikeBook);
router.get('/liked-books', getLikedBooks);

module.exports = router;
