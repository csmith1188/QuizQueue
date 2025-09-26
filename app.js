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

// Possibly create a module for the routes and import it here

// Define routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/class', (req, res) => {
    res.render('Class.ejs');
});


app.get('/quizzes', (req, res) => {
    db.all("SELECT * FROM quizzes", [], (err, rows) => {
        if (err) {
            console.error('Error fetching quizzes:', err.message);
        } else {
            res.render('quizzes', { quizzes: rows });
        }
    })

});

app.post('/quizzes', (req, res) => {
    var quizTitle = req.body.quizTitle;
    
    db.run(`INSERT INTO quizzes (quizName) VALUES (?)`, (quizTitle), function (err) {
        if (err) {
            console.error('Error inserting quiz:', err.message);
        } else {
            console.log(quizTitle)
            console.log(`A new quiz has been created with ID ${this.lastID}`);
            res.redirect('/quizzes')
        }

    })
});

app.get('/viewQuiz', (req, res) => {
    res.render('viewQuiz.ejs')
})

app.get('/addQuestion', (req, res) => {
    res.render('addQuestion');
});

app.post('/addQuestion', (req, res) => {
    var question = req.body.addQuestion

    var answer1 = req.body.answer1;
    var answer2 = req.body.answer2;
    var answer3 = req.body.answer3;
    var answer4 = req.body.answer4;

    if (!question || !answer1 || !answer2) {
        //To be further updated
        res.send('Please fill in all required fields (question, answer 1, and answer 2). (Please refresh the page to try again)');
    } else {
        // Insert the question + answers into the database
    }
});

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
const FORMBAR_URL = 'http://172.16.3.159:420/';
const API_KEY = '0c396ef91f031c6a36624a832487f55930f0c4dc8e414a0d49711aa47e845101';

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