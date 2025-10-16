module.exports = function (app) {

app.get('/queue', (req, res) => {
    res.render('queue.ejs')
})

};