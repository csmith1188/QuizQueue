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

// Create HTTP server
const server = http.createServer(app);

// Formbar Oauth URLs
const FBJS_URL = 'https://formbeta.yorktechapps.com';
const THIS_URL = `http://localhost:${port}/login`;
const API_KEY = process.env.API_KEY;

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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) next()
    else res.redirect(`/login?redirectURL=${THIS_URL}`)
}

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
            "User"	INTEGER NOT NULL,
	        "Classes"	TEXT NOT NULL UNIQUE,
	        "Lists"	TEXT NOT NULL,
	        PRIMARY KEY("Lists" AUTOINCREMENT)
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS Questions(
            "List" TEXT NOT NULL,
            "Question" TEXT NOT NULL,
            "Answer1" TEXT NOT NULL,
            "Answer2" TEXT NOT NULL,
            "Answer3" TEXT,
            "Answer4" TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

//get and post requests
app.get('/', isAuthenticated, (req, res) => {
    try {
        fetch(`${FBJS_URL}/api/me`, {
            method: 'GET',
            headers: {
                'API': API_KEY,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                return response.json();
            })
            .then(data => { 
                req.session.user = data.displayName;
                console.log(data); //log formbar user data for testing purposes
            })
            .then(() => {
                res.render('home', { user: req.session.user });
            })
    }
    catch (error) {
        res.send(error.message)
    }
});

app.get('/login', (req, res) => {
	if (req.query.token) {
		let tokenData = jwt.decode(req.query.token)
		req.session.token = tokenData
		req.session.user = tokenData.displayName
		res.redirect('/')
	} else {
		res.redirect(`${FBJS_URL}/oauth?redirectURL=${THIS_URL}`)
	}
})

app.get('/add', (req, res) => {
    res.render('addQ');
});

app.post('/add', (req, res) => {
    const Qdata = {
        question: req.body.addQ,
        answer1: req.body.answer1,
        answer2: req.body.answer2,
        answer3: req.body.answer3,
        answer4: req.body.answer4
    }


    db.run(`INSERT INTO Questions (List, Question, Answer1, Answer2, Answer3, Answer4) VALUES (?,?,?,?,?,?)`, questionData, function (err) {
        if (err) {
            console.error('Error inserting quiz:', err.message);
        } else {
            console.log(`A new question has been inserted`);
        }
    }
    )
    res.redirect('addQuestion');
});

app.get('/class', (req, res) => {
    res.render('Class.ejs');
});


app.get('/quizzes', (req, res) => {
    res.render("quizzes.ejs")
});

app.post('/quizzes', (req, res) => {
    var quizName = req.body.quizName;
    if (quizName) {
        db.run(`INSERT INTO access (User, Classes, Lists) VALUES (?,?,?)`, [1, 'Sample Class', quizName], function (err) {
            if (err) {
                console.error('Error inserting quiz:', err.message);
            } else {
                console.log(`A new quiz has been inserted with id ${this.lastID}`);
            }
        });
    }
});

app.get('/viewQuiz', (req, res) => {
    res.render('viewQuiz.ejs')
})


app.get('/viewQuestion', (req, res) => {
    res.render('viewQuestion.ejs')
});

app.get('/queue', (req, res) => {
    res.render('queue.ejs')
})

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