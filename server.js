const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dbConnect = require('./config/dbConnect');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
dbConnect();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);

// Dashboard route 
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Catch-all route to serve index.html for any other requests
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`InkQuest Server is running on http://localhost:${PORT}`);
});
