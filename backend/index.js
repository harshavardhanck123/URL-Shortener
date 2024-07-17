const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to parse JSON request bodies
app.use(express.json());

// Load environment variables
const mongoUri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with failure
    });

// Import routes
const userRoutes = require('./routes/userRoutes');
const urlRoutes = require('./routes/urlRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/urls', urlRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on http://127.0.0.1:${PORT}`));
