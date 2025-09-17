// Import modules
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { render } = require('ejs');

// Create an instance of Express
const app = express();

// Set up EJS as the templating engine
path.join(__dirname, 'views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', (req, res) => { 
	res.render("teacher.ejs")
});

app.get('/classes', (req, res) => { 
	res.render("classes.ejs")
});

app.get('/lists', (req, res) => { 
	res.render("lists.ejs")
});

app.get('/questions', (req, res) => { 
	res.render("questions.ejs")
});

app.get('/queue', (req, res) => { 
	res.render("queue.ejs")
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});