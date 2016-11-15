var BigNumber = require('bignumber.js');
var web3 = require('./web3');

var formatAddress = function(input){
    if (typeof(input) !== 'string') {
        return input;
    } else if (input.length < 2 || input.slice(0,2) !== '0x') {
        return '0x' + input;
    } else {
        return input;
    }
}

var bchexdec = function(hex) {
    dec = new BigNumber(0);
    len = hex.length;
    for (var i = 1; i <= len; i++) {
        var bcmul = new BigNumber(parseInt(hex[i - 1], 16)).times(new BigNumber(16).pow(len - i));
        dec = dec.plus(bcmul);
    }
    return dec;
}

var transInt = function(value){return +value};
var transUtf8 = function(value){return web3.toUtf8(value)};
var transString = function(value){return "" + value};
// var transAddress = function(value){return transString(value).substring(0, 2) == "0x"? transString(value).substring(2): transString(value)};
var transAddress = transString;
var transEther = function(value){return +web3.fromWei(value, "ether")};

exports = module.exports = {
    formatAddress: formatAddress,
    bchexdec: bchexdec,
    transInt: transInt,
    transUtf8: transUtf8,
    transString: transString,
    transAddress: transAddress,
    transEther: transEther
};
