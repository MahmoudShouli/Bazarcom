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

// Create the 'books' table and insert initial book data
// db.serialize(() => {
//     // Create the 'books' table if it doesn't already exist
//     db.run(`CREATE TABLE IF NOT EXISTS books (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         title TEXT NOT NULL,
//         stock INTEGER NOT NULL,
//         cost REAL NOT NULL,
//         topic TEXT NOT NULL
//     )`, (err) => {
//         if (err) {
//             console.error('Error creating table:', err.message);
//         } else {
//             console.log('Books table created or already exists.');
//         }
//     });

    // Insert book entries into the 'books' table
    // const books = [
    //     { title: "How to get a good grade in DOS in 40 minutes a day.", stock: 10, cost: 29.99, topic: "distributed systems" },
    //     { title: "RPCs for Noobs", stock: 8, cost: 24.99, topic: "distributed systems" },
    //     { title: "Xen and the Art of Surviving Undergraduate School", stock: 5, cost: 19.99, topic: "undergraduate school" },
    //     { title: "Cooking for the Impatient Undergrad", stock: 6, cost: 14.99, topic: "undergraduate school" }
    // ];

    // const insertStmt = db.prepare("INSERT INTO books (title, stock, cost, topic) VALUES (?, ?, ?, ?)");
    // books.forEach(book => {
    //     insertStmt.run(book.title, book.stock, book.cost, book.topic, (err) => {
    //         if (err) {
    //             console.error('Error inserting book:', err.message);
    //         }
    //     });
    // });
    // insertStmt.finalize();

    // console.log('Book entries added to the database.');

    // Query the 'books' table to print all entries
    // db.all("SELECT * FROM books", (err, rows) => {
    //     if (err) {
    //         console.error('Error fetching books:', err.message);
    //     } else {
    //         console.log('Books in the database:');
    //         rows.forEach((row) => {
    //             console.log(`${row.id}: ${row.title} (Stock: ${row.stock}, Cost: $${row.cost}, Topic: ${row.topic})`);
    //         });
    //     }
    // });
// });


// Export the db object so it can be used elsewhere
module.exports = db;