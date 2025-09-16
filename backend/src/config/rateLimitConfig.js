const { globalRateLimit, apiRateLimit, searchRateLimit, uploadRateLimit } = require('../middleware/globalRateLimit');

const configureRateLimits = (app) => {
    // Global rate limiting
    app.use(globalRateLimit);

    // API endpoints rate limiting
    app.use('/api/', apiRateLimit);

    // Search endpoints rate limiting  
    app.use('/api/search', searchRateLimit);

    // Upload endpoints rate limiting
    app.use('/api/upload', uploadRateLimit);
};

module.exports = configureRateLimits;