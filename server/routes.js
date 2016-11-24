var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var settings = require('../settings');
var middlewares = require('./middlewares');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var routes = {
	api: require('./api')
};

exports = module.exports = function(app) {
    app.use('/static', express.static(path.join(__dirname, 'static')));
    
    app.use(session({
        secret: settings.secret,
        resave: false, // don't save session if unmodified
        saveUninitialized: false, // don't create session until something stored
        cookie: {
            maxAge: 3600000 * 24 * 365 * 10
        },
        store: new MongoStore({mongooseConnection: mongoose.connection, ttl: 3600 * 24 * 365 * 10})
    }));
    
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    
    app.use(middlewares.set_user);
    
    app.set('port', process.env.PORT || 8000);
    
    app.get('/' + settings.wechatAuthFileName, function(req, res) {
        res.send(settings.wechatAuthFileValue);
    });
    
    app.get('/', function(req, res) {
        res.render("mobile", {});
    });
    
    app.get('/api', function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.sendStatus(200);
    });
    app.post('/api', routes.api.home);
    
    app.post('/api/login', routes.api.login);
    app.post('/api/logout', routes.api.logout);
    app.all('/api/me', middlewares.login_required, routes.api.me);
    app.post('/api/wechatlogin', middlewares.check_wechat_oauth, routes.api.wechatlogin);
    
    app.get('/api/coinprice', routes.api.coinprice);
};
