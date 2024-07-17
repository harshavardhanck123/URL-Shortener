const { check, validationResult } = require('express-validator');

const validateUrlCreation = [
    check('longUrl').isURL().withMessage('Please include a valid URL'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateUrlCreation };
