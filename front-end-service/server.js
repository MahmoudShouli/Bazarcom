const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');
const { responseTimeMiddleware } = require('./middleware/responseTime');

const app = express();
const PORT = process.env.PORT || 3002;

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
let catalogServiceIndex = 0;
let orderServiceIndex = 0;

const catalogServices = [
    { name: 'catalog-service-1', url: 'http://catalog-service-1:3000' },
    { name: 'catalog-service-2', url: 'http://catalog-service-2:3000' }
];

const orderServices = [
    { name: 'order-service-1', url: 'http://order-service-1:3001' },
    { name: 'order-service-2', url: 'http://order-service-2:3001' }
];

app.use(bodyParser.json());
app.use(responseTimeMiddleware);
app.use(express.static(path.join(__dirname, 'views')));

// Helper function for round-robin selection
function getNextService(services, index) {
    const service = services[index];
    console.log(`Routing request to ${service.name} (${service.url})`);
    return {
        service,
        nextIndex: (index + 1) % services.length
    };
}

app.post('/invalidate/:id', (req, res) => {
    const id = req.params.id;
    if (cache.del(id)) {
        console.log(`Cache invalidated for item ID: ${id}`);
        res.status(200).send(`Cache invalidated for item ID: ${id}`);
    } else {
        console.log(`No cache entry found for item ID: ${id}`);
        res.status(404).send(`No cache entry found for item ID: ${id}`);
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/search/:topic', async (req, res) => {
    const topic = req.params.topic;
    const cachedData = cache.get(topic);

    if (cachedData) {
        console.log('Cache hit for topic:', topic);
        return res.json(cachedData);
    }

    let service; 

    try {
        const result = getNextService(catalogServices, catalogServiceIndex);
        service = result.service;
        catalogServiceIndex = result.nextIndex;

        const response = await axios.get(`${service.url}/search/${topic}`);
        cache.set(topic, response.data);
        console.log(`Cache miss for topic: ${topic} - handled by ${service.name}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching data from ${service.name} (${service.url})`);
        if (error.response) {
            console.error(`Response Status: ${error.response.status}`);
            console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error(`No response received from ${service.name}`);
            console.error(`Request Details: ${error.request}`);
        } else {
            console.error(`Request Error: ${error.message}`);
        }
        res.status(500).json({ error: `Internal server error while communicating with ${service.name}` });
    }
    
});

app.get('/info/:id', async (req, res) => {
    const id = req.params.id;
    const cachedData = cache.get(id);

    if (cachedData) {
        console.log('Cache hit for book with id:', id);
        return res.json(cachedData);
    }

    let service; 

    try {
        const result = getNextService(catalogServices, catalogServiceIndex);
        service = result.service;
        catalogServiceIndex = result.nextIndex;

        const response = await axios.get(`${service.url}/info/${id}`);
        cache.set(id, response.data);
        console.log(`Cache miss for book with id: ${id} - handled by ${service.name}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching data from ${service.name} (${service.url})`);
        if (error.response) {
            console.error(`Response Status: ${error.response.status}`);
            console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error(`No response received from ${service.name}`);
            console.error(`Request Details: ${error.request}`);
        } else {
            console.error(`Request Error: ${error.message}`);
        }
        res.status(500).json({ error: `Internal server error while communicating with ${service.name}` });
    }
    
});

app.post('/purchase/:id', async (req, res) => {
    const { quantity } = req.body;
    let orderService, catalogService;

    try {
        
        const catalogResult = getNextService(catalogServices, catalogServiceIndex);
        catalogService = catalogResult.service;
        catalogServiceIndex = catalogResult.nextIndex;

        console.log(`Selected catalog service: ${catalogService.name}`);

        
        const orderResult = getNextService(orderServices, orderServiceIndex);
        orderService = orderResult.service;
        orderServiceIndex = orderResult.nextIndex;

        console.log(`Selected order service: ${orderService.name}`);

        const response = await axios.post(`${orderService.url}/purchase/${req.params.id}`, {
            quantity,
            catalogServiceName: catalogService.name
        });

        console.log(`Purchase request for item ID ${req.params.id} handled by ${orderService.name} using ${catalogService.name}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error processing purchase request at ${orderService?.name || 'unknown order service'} (${orderService?.url || 'unknown URL'})`);
        if (error.response) {
            console.error(`Response Status: ${error.response.status}`);
            console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error(`No response received from ${orderService?.name || 'unknown service'}`);
            console.error(`Request Details: ${JSON.stringify(error.request, null, 2)}`);
        } else {
            console.error(`Request Error: ${error.message}`);
        }
        res.status(500).json({ error: `Internal server error while communicating with ${orderService?.name || 'order service'}` });
    }
});


app.listen(PORT, () => {
    console.log(`Frontend server is running on port ${PORT}..`);
});
