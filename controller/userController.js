const User = require('../model/User');

const likeBook = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, title, author, coverId, firstPublishYear } = req.body;

        if (!bookId || !title) {
            return res.status(400).json({ error: 'bookId and title are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already liked
        const likedBooks = user.likedBooks || [];
        const alreadyLiked = likedBooks.some(b => b.bookId === bookId);
        if (!alreadyLiked) {
            if (!user.likedBooks) user.likedBooks = [];
            user.likedBooks.push({ bookId, title, author, coverId, firstPublishYear });
            await user.save();
        }

        res.json({ message: 'Book liked successfully', likedBooks: user.likedBooks });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to like book' });
    }
};

const unlikeBook = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).json({ error: 'bookId is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.likedBooks) user.likedBooks = [];
        user.likedBooks = user.likedBooks.filter(b => b.bookId !== bookId);
        await user.save();

        res.json({ message: 'Book unliked successfully', likedBooks: user.likedBooks });
    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({ error: 'Failed to unlike book' });
    }
};

const getLikedBooks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ likedBooks: user.likedBooks || [] });
    } catch (error) {
        console.error('Get liked books error:', error);
        res.status(500).json({ error: 'Failed to fetch liked books' });
    }
};

module.exports = {
    likeBook,
    unlikeBook,
    getLikedBooks
};
