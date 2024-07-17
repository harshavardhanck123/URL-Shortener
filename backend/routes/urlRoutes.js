const express = require('express');
const auth = require('../middleware/auth');
const { validateUrlCreation } = require('../middleware/validateUser');
const urlController = require('../controllers/urlController');

const router = express.Router();

// Create short URL
router.post('/shorten', auth, validateUrlCreation, urlController.createShortUrl);

// Get short URL
router.get('/:shortUrl', urlController.getShortUrl);

// Get all URLs
router.get('/', auth, urlController.getUrls);

module.exports = router;
