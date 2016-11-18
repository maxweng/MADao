exports = module.exports = function (req, res) {
    req.session.destroy(function(){
        res.status(204).send();
    });
}