const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');
const { Server } = require('http');
const app = express();
const port = 3000;
const http = require('http')
const io = require('socket.io')(http);

const server = http.createServer(
    (req, res) => {
        console.log('Request received');
    }
);

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

/*// Configure Websocket server to run on the same port as Express server
const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (socket) => {

    socket.on('requestQuizzes', () => {
        db.all("SELECT * FROM Lists", [], (err, rows) => {
            if (err) {
                console.error('Error fetching quizzes:', err.message);
                socket.emit('quizzesData', { error: 'Error fetching quizzes' });
            } else {
                socket.emit('quizzesData', rows);
            }
        });
    });

    socket.on('addQuestion', () => {
        db.all(`SELECT * FROM Questions`, [], (err, rows) => {
            if(err) {
                console.error('Error fetching questions:', err.message);
                socket.emit('questionsData', { error: 'Error fetching questions' });
            } else {
                socket.emit('questionsData', rows);
            }
        });
    });
});
*/

// Meant for formbar Oauth testing
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/addQuestion', (req, res) => {
    res.render('addQuestion');
});

app.post('/addQuestion', (req, res) => {
    questionData = {
        List : req.body.List,
        question: req.body.addQuestion,
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

// FORMBAR STUFF
const FORMBAR_URL = 'formbeta.yorktechapps.com'; // Change this if your Formbar is hosted somewhere else.
const API_KEY = 'a4c9743f4e26e3c8cd412bba542620e3db0dbb741d01ade241cd58bb899669f0'; // Get your API key from https://formbeta.yorktechapps.com/dashboard

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