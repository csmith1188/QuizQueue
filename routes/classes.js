module.exports = function (app) {
    app.get('/classes', (req, res) => {
        res.render("classes.ejs");
    });
};