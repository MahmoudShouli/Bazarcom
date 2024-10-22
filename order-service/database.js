// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or open the 'database.db' file
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the database.');
    }
});

// Create the 'order' table
// db.serialize(() => {
//     // Create the 'orders' table if it doesn't already exist
//     db.run(`CREATE TABLE IF NOT EXISTS orders (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         bookId INTEGER NOT NULL,
//         copies INTEGER NOT NULL,
//         cost REAL NOT NULL
//     )`, (err) => {  
//         if (err) {
//             console.error('Error creating table:', err.message);
//         } else {
//             console.log('Orders table created or already exists.');
//         }
//     });
// });

// Export the db object so it can be used elsewhere
module.exports = db;
