const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = 'http://front-end-service:3002';

async function invalidateCache(id) {
    try {
        await axios.post(`${FRONTEND_URL}/invalidate/${id}`);
        console.log(`Cache invalidation request sent for item ID: ${id}`);
    } catch (error) {
        console.error('Failed to invalidate cache:', error.message);
    }
}

async function synchronizeWrite(id, data) {
    const replicas = [
        'http://order-service-2:3001',
        'http://order-service-1:3001'
    ];
    for (const replicaUrl of replicas) {
        if (!replicaUrl.includes(`:${PORT}`)) {
            try {
                await axios.put(`${replicaUrl}/sync-update/${id}`, data);
                console.log(`Synchronized update with ${replicaUrl}`);
            } catch (error) {
                console.error(`Failed to synchronize with ${replicaUrl}:`, error.message);
            }
        }
    }
}


app.post('/purchase/:id', async (req, res) => {
    const bookId = req.params.id;
    const { quantity, catalogServiceName } = req.body;

    if (!bookId || quantity <= 0) {
        return res.status(400).json({ error: "Invalid bookId or quantity" });
    }

    const catalogServices = {
        'catalog-service-1': 'http://catalog-service-1:3000',
        'catalog-service-2': 'http://catalog-service-2:3000'
    };

    const catalogServiceUrl = catalogServices[catalogServiceName];
    if (!catalogServiceUrl) {
        return res.status(400).json({ error: "Invalid catalogServiceName" });
    }

    try {
        await invalidateCache(bookId);

        const response = await axios.get(`${catalogServiceUrl}/info/${bookId}`);
        const book = response.data;

        if (book.stock >= quantity) {
            const newStock = book.stock - quantity;
            await axios.put(`${catalogServiceUrl}/update/${bookId}`, {
                title: book.title,
                stock: newStock,
                cost: book.cost,
                topic: book.topic
            });

            await synchronizeWrite(bookId, {
                title: book.title,
                stock: newStock,
                cost: book.cost,
                topic: book.topic
            });

            db.run("INSERT INTO orders (bookId, copies, cost) VALUES (?, ?, ?)", [bookId, quantity, book.cost * quantity], function (err) {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Failed to place order" });
                }
                res.json({ success: "Order placed successfully" });
            });
        } else {
            res.status(400).json({ error: "Not enough stock available" });
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Error interacting with catalog service" });
    }
});


app.put('/sync-update/:id', (req, res) => {
    const bookId = req.params.id;
    const { title, stock, cost, topic } = req.body;

    const sql = `
        UPDATE books 
        SET title = ?, stock = ?, cost = ?, topic = ? 
        WHERE id = ?
    `;

    db.run(sql, [title, stock, cost, topic, bookId], function (err) {
        if (err) {
            console.error("Synchronization error:", err);
            return res.status(500).json({ error: "Failed to synchronize update" });
        }
        console.log(`Synchronized update for book ID ${bookId}`);
        res.json({ success: `Synchronized update for book ID ${bookId}` });
    });
});

app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}..`);
});
