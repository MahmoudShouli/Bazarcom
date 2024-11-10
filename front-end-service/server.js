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

// for load balancing between replicas
let catalogServers = ['catalog-service_1:3000', 'catalog-service_2:3000'];
let orderServers = ['order-service_1:3001', 'order-service_2:3001'];

let catalogIndex = 0;
let orderIndex = 0;

function getNextCatalogServer() {
    const server = catalogServers[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogServers.length; // Round-robin
    return server;
}

function getNextOrderServer() {
    const server = orderServers[orderIndex];
    orderIndex = (orderIndex + 1) % orderServers.length; // Round-robin
    return server;
}


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
        const catalogServer = getNextCatalogServer();
        const response = await axios.get(`http://${catalogServer}:3000/search/${topic}`);
        cache.set(topic, response.data);
        console.log("Cache miss for topic : ", topic)
        console.log("response returned from : ", catalogServer)
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
        const catalogServer = getNextCatalogServer();
        const response = await axios.get(`http://${catalogServer}:3000/info/${id}`);
        cache.set(id, response.data);
        console.log("Cache miss for book with id : ", id)
        console.log("response returned from : ", catalogServer)
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from catalog service' });
    }
});

// Endpoint to purchase by item ID (no cache, because it's a post request)
app.post('/purchase/:id', async (req, res) => {
    const { quantity } = req.body;
    try {
        const orderServer = getNextOrderServer();
        const response = await axios.post(`http://${orderServer}:3001/purchase/${req.params.id}`, { quantity });
        res.json(response.data);
        console.log("response returned from : ", orderServer)
    } catch (error) {
        res.status(500).json({ error: 'Error purchasing item' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}..`);
});
