const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');
const { responseTimeMiddleware } = require('./middleware/responseTime');

const app = express();
const PORT = process.env.PORT || 3002;

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

app.use(bodyParser.json());
app.use(responseTimeMiddleware);
app.use(express.static(path.join(__dirname, 'views')));

// Endpoint to serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint to search by topic
app.get('/search/:topic', async (req, res) => {

    const topic = req.params.topic;

    const cachedData = cache.get(topic);

    if(cachedData){
        console.log("Cache hit for topic : ", topic)
        return res.json(cachedData);
    }

    try {
        const response = await axios.get(`http://catalog-service:3000/search/${topic}`);
        cache.set(topic, response.data);
        console.log("Cache miss for topic : ", topic)
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from catalog service' });
    }
});

// Endpoint to get info by item ID
app.get('/info/:id', async (req, res) => {

    const id = req.params.id;

    const cachedData = cache.get(id);

    if(cachedData){
        console.log("Cache hit for book with id : ", id)
        return res.json(cachedData);
    }


    try {
        const response = await axios.get(`http://catalog-service:3000/info/${id}`);
        cache.set(id, response.data);
        console.log("Cache miss for book with id : ", id)
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from catalog service' });
    }
});

// Endpoint to purchase by item ID (no cache, because it's a post request)
app.post('/purchase/:id', async (req, res) => {
    const { quantity } = req.body;
    try {
        const response = await axios.post(`http://order-service:3001/purchase/${req.params.id}`, { quantity });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error purchasing item' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}..`);
});
