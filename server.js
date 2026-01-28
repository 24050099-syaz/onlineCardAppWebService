// include the required packages

const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;
const DEMO_USER = { id: 1, username: "admin", password: "admin123" };

//database config info

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

//initialize express app
const app = express();

//helps app to read JSON
app.use(express.json());

//start the server
app.listen(port, () => {
    console.log(`Server running on port`, port);
});

// Create pool ONCE at startup
const pool = mysql.createPool(dbConfig);

const cors = require("cors");

const allowedOrigins = [
    "http://localhost:3000",
    "https://card-app-smoky.vercel.app",
    "https://onlinecardappwebservice-vr14.onrender.com"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (Postman/server-to-server)
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

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.post("/login", (req, res) => {
    const { username, password } = req.body;
        if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" });
        }
    const token = jwt.sign(
        { userId: DEMO_USER.id, username: DEMO_USER.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
    res.json({ token });
});


function requireAuth(req, res, next) {
    const header = req.headers.authorization; // "Bearer <token>"
    if (!header) return res.status(401).json({ error: "Missing Authorization header" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Invalid Authorization format" });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
        } catch {
        return res.status(401).json({ error: "Invalid/Expired token" });
    }
}


// Example Route: Get all cards
app.get('/allcards',async(req,res)  => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server error for allcards'});
    }
});

// Example Route: Create a new card
app.post('/addcard',requireAuth,async(req,res)  => {
    const { card_name, card_pic} = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?,?)',[card_name, card_pic]);
        res.status(201).json({message: 'Card '+card_name+' added successfully'});
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server errpr - could not add card '+card_name});
    }

});

// Example Route: Update card
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

// Example Route: Delete card
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


