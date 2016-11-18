var utils = require("../utils");
var web3 = utils.web3;

var MDC = require("../build/contracts/MDC.sol.js");

MDC.setProvider(web3.currentProvider);

var mdc = MDC.deployed();

res = {
    load: function(cb){
        if(typeof(cb) === "undefined") cb = function(){};
        cb();
    },
    MDC: MDC,
    mdc: mdc
};

exports = module.exports = res;