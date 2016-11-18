var utils = require('../utils');
var web3 = utils.web3;

var mongoose = require('mongoose');
var settings = require('../settings');

var models = require("./models");

var contracts = require("./contracts");

mongoose.connect(settings.dbURL);

exports = module.exports = function(cb) {
    if(typeof(cb) === "undefined") cb = function(){};
    contracts.load(cb);
}