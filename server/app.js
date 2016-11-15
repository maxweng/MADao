#!/usr/bin/env node

var boot = require('./boot');

var express = require('express');
var http = require('http');
var app = express();
var routes = require('./routes');

routes(app);

boot(function(){
    require('./tasks'); // start cron job
    
    var server = http.createServer(app);
    
    server.listen(app.get('port'), function() { 
        console.log((new Date()) + " Server is listening on port " + app.get('port'));
    });
});
