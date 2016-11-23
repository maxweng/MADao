var utils = require("../utils");
var web3 = utils.web3;
var settings = require("../settings");

var MDC = require("../build/contracts/MDC.sol.js");

MDC.setNetwork(settings.networkId);

MDC.setProvider(web3.currentProvider);

var mdc = MDC.deployed();

console.log("MDC address: ", mdc.address);

res = {
    load: function(cb){
        if(typeof(cb) === "undefined") cb = function(){};
        cb();
    },
    MDC: MDC,
    mdc: mdc
};

exports = module.exports = res;