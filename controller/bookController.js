const axios = require('axios');

// Fetch books based on search query
const searchBooks = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Use Open Library Search API with a User-Agent header
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`, {
            headers: {
                'User-Agent': 'InkQuestApp/1.0 (developer@inkquest.app)'
            }
        });
        
        // Map the results to a cleaner format
        const books = response.data.docs.map(doc => ({
            id: doc.key, // usually in format /works/OL12345W
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            coverId: doc.cover_i,
            firstPublishYear: doc.first_publish_year
        }));

        res.json({ books });
    } catch (error) {
        console.error('Error searching books:', error.message);
        res.status(500).json({ error: 'Failed to search books' });
    }
};

// Fetch book details (introduction/description)
const getBookDetails = async (req, res) => {
    try {
        // The id from Open Library is like "OL12345W". It's usually part of the key: "/works/OL12345W"
        const { id } = req.params;
        
        const response = await axios.get(`https://openlibrary.org/works/${id}.json`, {
            headers: {
                'User-Agent': 'InkQuestApp/1.0 (developer@inkquest.app)'
            }
        });
        const data = response.data;
        
        // Open library description can be a string or an object with a 'value' property
        let description = "No introduction available for this curious book.";
        if (data.description) {
            if (typeof data.description === 'string') {
                description = data.description;
            } else if (data.description.value) {
                description = data.description.value;
            }
        }

        res.json({
            title: data.title,
            description: description
        });

    } catch (error) {
        console.error('Error fetching book details:', error.message);
        res.status(500).json({ error: 'Failed to fetch book details' });
    }
};

// Fetch famous book recommendations
const getRecommendations = async (req, res) => {
    try {
        // Query Open Library for popular books, e.g. using a predefined subject or query
        const query = 'subject:classic_literature'; // Fetch some classics
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`, {
            headers: {
                'User-Agent': 'InkQuestApp/1.0 (developer@inkquest.app)'
            }
        });
        
        const books = response.data.docs.map(doc => ({
            id: doc.key,
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            coverId: doc.cover_i,
            firstPublishYear: doc.first_publish_year
        }));

        res.json({ books });
    } catch (error) {
        console.error('Error fetching recommendations:', error.message);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
};

module.exports = {
    searchBooks,
    getBookDetails,
    getRecommendations
};
