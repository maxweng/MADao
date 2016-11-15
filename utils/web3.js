var Web3 = require("web3");
var web3;

var HookedWeb3Provider = require('hooked-web3-provider');
var Tx = require('ethereumjs-tx');

var settings = require("../settings");

var strip0x = function (input) {
    if (typeof(input) !== 'string') {
        return input;
    } else if (input.length >= 2 && input.slice(0,2) === '0x') {
        return input.slice(2);
    } else {
        return input;
    }
}

var formatAddress = function(input){
    if (typeof(input) !== 'string') {
        return input;
    } else if (input.length < 2 || input.slice(0,2) !== '0x') {
        return '0x' + input;
    } else {
        return input;
    }
}

if (typeof web3 !== "undefined") {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new HookedWeb3Provider({
        host: "http://" + settings.rpc.host + ":" + settings.rpc.port,
        transaction_signer: {
            hasAddress: function(address, callback) {
                var addrToCheck = formatAddress(address);
                if (addrToCheck == settings.sysAccountAddress) {
                    callback(null, true);
                }
                else {
                    callback('Address not found!', false);
                }
            },
            signTransaction: function(txParams, callback) {
                var privateKey = new Buffer(settings.sysAccountPrivateKey, 'hex');

                var tx = new Tx(txParams);
                tx.sign(privateKey);
                
                var serializedTx = tx.serialize();
                callback(null, serializedTx.toString('hex'));
            }
        }
    }));
    web3.eth.defaultAccount = settings.sysAccountAddress;
}

if (web3.isConnected()) {
    console.log("Web3 connection established");
} else {
    throw "No connection";
}

exports = module.exports = web3;
