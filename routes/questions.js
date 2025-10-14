
app.get('/questions', (req, res) => {
    res.render("questions.ejs");
});


app.get('/getQuestions', (req, res) => {
    const quizID = req.query.quizID;

    console.log(quizID);
    if (!quizID) {
        return res.status(400).json({ error: 'quizID is required' });
    }

    try {
        // Query the database for questions based on quizID
        const result = []; // Replace with actual database query

        if (!Array.isArray(result)) {
            return res.status(500).json({ error: 'Invalid data format from database' });
        }

        res.json(result); // Return the questions as JSON

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/addQuestion', (req, res) => {
    const quizID = req.query.quizSelection
    const question = req.body.addQuestion
    const answers = req.body.answers || []

    db.run(`INSERT INTO questions (quizID, question) VALUES (?)`, [quizID, question],
        function (err) {
            if (err) {
                console.error('Error inserting quiz:', err.message);
            } else {
                console.log(`A new question has been inserted`);
            }
        }
    )

    answers.forEach(answer => {
        db.run(`INSERT INTO answer (questionID, answer) VALUES (?, ?)`, [this.lastID, answer],
            function (err) {
                if (err) {
                    console.error('Error inserting answer:', err.message);
                } else {
                    console.log(`A new answer has been inserted`);
                }
            }
        )
    });

    res.redirect('/quizzes');
});
