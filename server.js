// include the required packages
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require("cors");
require('dotenv').config();

const port = 3000;

// database config info
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

// initialize express app
const app = express();

// ===== CORS CONFIG =====
const allowedOrigins = [
    "http://localhost:3000",
    "https://card-app-smoky.vercel.app",
    // "https://YOUR-frontend.onrender.com"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (Postman / server-to-server)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

// helps app to read JSON
app.use(express.json());

// ===== ROUTES =====

// Get all cards
app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error for allcards' });
    }
});

// Create a new card
app.post('/addcard', async (req, res) => {
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO cards (card_name, card_pic) VALUES (?, ?)',
            [card_name, card_pic]
        );
        res.status(201).json({ message: `Card ${card_name} added successfully` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: `Server error - could not add card ${card_name}` });
    }
});

// Update card
app.put('/updatecard/:id', async (req, res) => {
    const { card_name, card_pic } = req.body;
    const { id } = req.params;

    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE cards SET card_name = ?, card_pic = ? WHERE id = ?',
            [card_name, card_pic, id]
        );
        res.json({ message: 'Card updated successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error - could not update card' });
    }
});

// Delete card
app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;

    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'DELETE FROM cards WHERE id = ?',
            [id]
        );
        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error - could not delete card' });
    }
});

// ===== START SERVER =====
app.listen(port, () => {
    console.log
