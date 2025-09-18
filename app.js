const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Check if the database file exists
const dbPath = './database.db';
if (fs.existsSync(dbPath)) {
    console.log('Database file exists.');
} else {
    console.log('Database file does not exist. It will be created.');
}

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS access (
            "User"	INTEGER NOT NULL UNIQUE,
	        "Classes"	TEXT NOT NULL UNIQUE,
	        "Lists"	TEXT NOT NULL,
	        "Questions"	TEXT NOT NULL,
	        PRIMARY KEY("User" AUTOINCREMENT)
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// Meant for formbar Oauth testing
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/add', (req, res) => {
    res.render('addQ');
});

app.post('/add', (req, res) => {
    const Qdata = {
        question : req.body.addQ,
        answer1 : req.body.answer1,
        answer2 : req.body.answer2,
        answer3 : req.body.answer3,
        answer4 : req.body.answer4}
    
    console.log(Qdata);
});

app.get('/class', (req, res) => {
    res.render('Class');
});

app.get('/view',(req, res) => {
    res.render('viewQuiz')
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});