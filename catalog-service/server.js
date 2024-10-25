// server.js
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Query by subject
app.get('/search/:topic', (req, res) => {
    const topic = req.params.topic;
    db.all("SELECT * FROM books WHERE topic = ?", [topic], (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(rows);
    });
});

// Query by item
app.get('/info/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!row) {
            return res.status(404).send('Book not found');
        }
        res.json(row);
    });
});


// PUT request to update a book
app.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { title, stock, cost, topic } = req.body;

    // SQL query to update the book
    const sql = `
        UPDATE books 
        SET title = ?, stock = ?, cost = ?, topic = ? 
        WHERE id = ?
    `;

    db.run(sql, [title, stock, cost, topic, id], function (err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (this.changes === 0) {
            return res.status(404).send('Book not found');
        }
        res.send(`Book with ID ${id} updated successfully`);
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}..`);
});
