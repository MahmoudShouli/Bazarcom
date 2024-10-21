const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Post request for Purchase 
app.post('/purchase', async (req, res) => {
    const { bookId, quantity } = req.body;

    // Input validation
    if (!bookId || quantity <= 0) {
        return res.status(400).json({ error: "Invalid bookId or quantity" });
    }

    try {
        // Call catalog service to check book information (including stock)
        const response = await axios.get(`http://localhost:3000/info/${bookId}`);
        const book = response.data;

        // Check if there is enough stock
        if (book.stock >= quantity) {
            // If stock is sufficient, decrement the stock
            const newStock = book.stock - quantity;
            await axios.put(`http://localhost:3000/update/${bookId}`, {
                title: book.title,
                stock: newStock,
                cost: book.cost,
                topic: book.topic
            });

            // Calculate the total cost
            const totalCost = book.cost * quantity;

            // Saving order in the database
            db.run("INSERT INTO orders (bookId, copies, cost) VALUES (?, ?, ?)", [bookId, quantity, totalCost], function(err) {
                if (err) {
                    console.error("Database error:", err); // Log the database error
                    return res.status(500).json({ error: "Failed to place order" });
                }
                res.json({ success: "Order placed successfully"});
            });

        } else {
            res.status(400).json({ error: "Not enough stock available" });
        }
    } catch (error) {
        console.error("Error:", error); // Log the error
        res.status(500).json({ error: "Error interacting with catalog service" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
