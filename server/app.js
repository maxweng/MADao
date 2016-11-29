#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var boot = require('./boot');
var settings = require('../settings');

var express = require('express');
var http = require('http');
var app = express();
var routes = require('./routes');

app.locals.moment = require('moment');
app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/templates'));

boot(function(){
    routes(app);
    
    require('./tasks'); // start cron job
    
    var server = http.createServer(app);
    
    server.listen(app.get('port'), function() { 
        fs.writeFileSync(path.resolve(settings.BASE_DIR, '.pid'), process.pid);
        console.log((new Date()) + " Server is listening on port " + app.get('port'));
    });
});
