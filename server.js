const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

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

const app = express();
app.use(express.json());

// Create pool ONCE at startup
const pool = mysql.createPool(dbConfig);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const cors = require("cors");
const allowedOrigins = [
    "http://localhost:3000",
    "https://card-app-smoky.vercel.app",
    "https://onlinecardappwebservice-vr14.onrender.com"
];

app.use(
    cors({
        origin: function (origin, callback) {
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

app.get('/allcards', async(req,res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        connection.release();
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server error for allcards'});
    }
});

app.post('/addcard', async(req,res) => {
    const { card_name, card_pic} = req.body;
    try{
        const connection = await pool.getConnection();
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?,?)', [card_name, card_pic]);
        connection.release();
        res.status(201).json({message: 'Card '+card_name+' added successfully'});
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server error - could not add card '+card_name});
    }
});

app.put('/updatecard/:id', async (req, res) => {
    const { card_name, card_pic } = req.body;
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE cards SET card_name = ?, card_pic = ? WHERE id = ?',
            [card_name, card_pic, id]
        );
        connection.release();
        res.json({ message: 'Card updated successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error - could not update card' });
    }
});

app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'DELETE FROM cards WHERE id = ?',
            [id]
        );
        connection.release();
        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error - could not delete card' });
    }
});
