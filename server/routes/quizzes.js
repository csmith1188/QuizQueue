
module.exports = function (app, db) {

    app.get('/quizzes', (req, res) => {
        db.all(`SELECT quizID, quizName FROM quizzes`, [], (err, rows) => {
            if (err) {
                console.error('Error fetching quizzes:', err.message);
                return res.status(500).send('Failed to fetch quizzes.');
            }

            // Render the quizzes.ejs page with the list of quizzes
            res.render('quizzes.ejs', { quizzes: rows });
        });
    });

    app.get('/viewQuiz', (req, res) => {
        res.render("viewQuiz.ejs", { quizTitle: req.query.quizTitle })
    });

    app.post('/addQuiz', (req, res) => {
        var quizName = req.body.quizName;

        if (!quizName) {
            return res.status(400).send('Quiz name is required.');
        }

        db.run(`INSERT INTO quizzes (quizName) VALUES (?)`, [quizName], function (err) {
            if (err) {
                console.error('Error inserting quiz:', err.message);
                return res.status(500).send('Failed to add quiz.');
            }

            console.log(`A new quiz has been inserted with the name: ${quizName}`);
            res.redirect('/quizzes');
        });
    });

    app.post('/changeQuizName', (req, res) => {
        var quizSelection = req.body.quizSelection;
        var newQuizName = req.body.newQuizName;

        if (!quizSelection) {
            return res.status(400).send('Quiz selection is required.');
        }

        if (!newQuizName) {
            return res.status(400).send('New quiz name is required.');
        }

        db.run(`UPDATE quizzes SET quizName = ? WHERE quizID = ?`, [newQuizName, quizSelection], function (err) {
            if (err) {
                console.error('Error updating quiz name:', err.message);
                return res.status(500).send('Failed to update quiz name.');
            }

            console.log(`Quiz ID ${quizID} has been updated to the new name: ${newQuizName}`);
            res.redirect('/quizzes');
        });
    });

};