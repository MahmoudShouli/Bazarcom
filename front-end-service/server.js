const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'views')));

// Endpoint to serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint to search by topic
app.get('/search/:topic', async (req, res) => {
    try {
        const response = await axios.get(`http://catalog-service:3000/search/${req.params.topic}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from catalog service' });
    }
});

// Endpoint to get info by item ID
app.get('/info/:id', async (req, res) => {
    try {
        const response = await axios.get(`http://catalog-service:3000/info/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from catalog service' });
    }
});

// Endpoint to purchase by item ID
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
