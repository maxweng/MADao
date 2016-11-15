var bodyParser = require('body-parser');

var routes = {
	api: require('./api')
};

exports = module.exports = function(app) {
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    
    app.set('port', process.env.PORT || 8080);
    
    app.get('/api', function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.sendStatus(200);
    });
    app.post('/api', routes.api.home);
};
