// Import required modules
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

// Initialize dotenv
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Serve static files from the "public" directory
app.use('/socket.io-client', express.static('./node_modules/socket.io-client/dist/'));

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to initialize session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretFillerKey',
    resave: false,
    saveUninitialized: true,
}));

// Route handlers
const auth = require('./routes/auth')
const classes = require('./routes/classes')
const questions = require('./routes/questions')
const quizzes = require('./routes/quizzes')
const queues = require('./routes/queues')

// Use route handlers
app.use( '/', auth );
app.use( '/classes', classes );
app.use( '/questions', questions );
app.use( '/queue', queues );
app.use( '/quizzes', quizzes );
console.log('Route handlers loaded.');

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
        db.run(`CREATE TABLE IF NOT EXISTS "user" (
	        "uid"	INTEGER NOT NULL UNIQUE,
	        "username"	TEXT NOT NULL UNIQUE,
	        "email"	TEXT NOT NULL UNIQUE,
	        PRIMARY KEY("uid" AUTOINCREMENT)
            );`, (err) => {
            if (err) {
                console.error('Error creating table 1:', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS classes(
            "class" TEXT NOT NULL,
            "uid" INTEGER NOT NULL,
            "ownerID" INTEGER NOT NULL,
            PRIMARY KEY("class")
             )`, (err) => {
            if (err) {
                console.error('Error creating table 2:', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS "quizzes" (
	        "quizID"	INTEGER NOT NULL UNIQUE,
	        "quizName"	TEXT NOT NULL UNIQUE,
	        "classID"	INTEGER,
	        PRIMARY KEY("quizID" AUTOINCREMENT)
        );`, (err) => {
            if (err) {
                console.error('Error creating table 3:', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS "questions" (
	        "questionID"	INTEGER NOT NULL UNIQUE,
	        "question"	TEXT NOT NULL,
	        "quizID"	INTEGER NOT NULL,
	        PRIMARY KEY("questionID" AUTOINCREMENT)
        );`, (err) => {
            if (err) {
                console.error('Error creating table 4:', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS answers(
            "answerID" INTEGER NOT NULL UNIQUE,
            "questionID" INTEGER NOT NULL,
            "answer" TEXT NOT NULL,
            PRIMARY KEY("answerID" AUTOINCREMENT)
            )`, (err) => {
            if (err) {
                console.error('Error creating table 5:', err.message);
            }
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Socket.io
const socket = new Server(server)

socket.on('connect', () => {
    console.log('Connected');
    socket.emit('getActiveClass');
});

socket.on('setClass', (newClassId) => {
    console.log(`The user is currently in the class with id ${newClassId}`);
});

let classId = 1; // Class Id here
let classCode = 'vmnt' // If you're not already in the classroom, you can join it by using the class code.
socket.emit('joinClass', classId);
socket.on('joinClass', (response) => {
    // If joining the class is successful, it will return true.
    if (response == true) {
        console.log('Successfully joined class')
        socket.emit('classUpdate')
    } else {
        // If not, try to join the classroom with the class code.
        socket.emit('joinRoom', classCode);
        console.log('Failed to join class: ' + response)
    }
});

socket.on('classUpdate', (classroomData) => {
    console.log(classroomData);
});

// True or false 
socket.emit('pollResp', 'True')

// Text response
socket.emit('pollResp', '', 'Text response here')

socket.on('connect_error', (error) => {
    /*
        "xhr poll error" is just the error it give when it can't connect,
        which is usually when the Formbar is not on or you are not on the same network.
    */
    if (error.message == 'xhr poll error') {
        console.log('no connection');
    } else {
        console.log(error.message);
    }

    setTimeout(() => {
        socket.connect();
    }, 5000);
});