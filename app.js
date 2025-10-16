// Import required modules
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

// Initialize dotenv
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const socket = new Server(server);

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket.io-client', express.static('./node_modules/socket.io-client/dist/'));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to initialize session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretFillerKey',
    resave: false,
    saveUninitialized: true,
}));

// Set Route handlers
const auth = require('./routes/auth')
const classes = require('./routes/classes')
const database = require('./routes/db')
const questions = require('./routes/questions')
const queue = require('./routes/queue')
const quizzes = require('./routes/quizzes')
const sio = require('./routes/socket')

// Initialize the database and store the ruturned db object
const db = database(sqlite3, fs);

// Initialize route handlers with dependencies
auth(app, jwt, port);
classes(app);
database(sqlite3, fs);
questions(app, db);
queue(app);
quizzes(app, db);
sio(socket);

// Use route handlers
app.use( '/', auth );
app.use( '/classes', classes );
app.use( '/questions', questions );
app.use( '/queue', queue );
app.use( '/quizzes', quizzes );
console.log('Route handlers loaded.');

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});