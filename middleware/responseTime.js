// responseTime.js
const responseTimes = [];
let requestCount = 0;

// Middleware function to track response time
const responseTimeMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        responseTimes.push(duration);

        // Limit to recent 100 entries for efficiency (optional)
        if (responseTimes.length > 100) responseTimes.shift();

        // Increment request count
        requestCount++;

        // Log average response time every 10 requests
        if (requestCount >= 10) {
            const averageResponseTime = getAverageResponseTime();
            console.log(`Average Response Time after 10 requests: ${averageResponseTime.toFixed(2)} ms`);

            // Reset the count and clear response times if desired
            requestCount = 0;
        }
    });
    next();
};

// Function to calculate average response time
const getAverageResponseTime = () => {
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avg = responseTimes.length ? sum / responseTimes.length : 0;

    responseTimes.length = 0;

    return avg;
};

module.exports = { responseTimeMiddleware };
