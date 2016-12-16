var utils = require('../../utils');
var web3 = utils.web3;

function getBalance(addr, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        var addr = utils.eth.formatAddress(addr);
        var balancehex = web3.eth.getBalance(addr, "pending");
        //var balance = utils.eth.bchexdec(balancehex);
        data["data"] = {
            "address": addr,
            "balance": balancehex.toString()
        }
    } catch (e) {
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}
function sendRawTransaction(rawtx, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        data["data"] = web3.eth.sendRawTransaction(rawtx);
    } catch (e) {
        console.log(e);
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}

function getTransactionData(addr, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        var addr = utils.eth.formatAddress(addr);
        var balance = web3.eth.getBalance(addr, "pending");
        var nonce = web3.eth.getTransactionCount(addr, "pending");
        var gasprice = web3.eth.gasPrice;
        //var balance = utils.eth.bchexdec(balance);
        data["data"] = {
            "address": addr,
            "balance": balance,
            "nonce": web3.toHex(nonce),
            "gasprice": web3.toHex(gasprice)
        }
    } catch (e) {
        console.log(e);
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}

function getTransaction(transactionId, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        data["data"] = web3.eth.getTransaction(transactionId)
    } catch (e) {
        console.log(e);
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}

function getEstimatedGas(txobj, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        data["data"] = web3.eth.estimateGas(txobj);
    } catch (e) {
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}

function getEthCall(txobj, gethRPC) {
    var data = utils.response.getDefaultResponse();
    try {
        data["data"] = web3.eth.call(txobj, "pending");
    } catch (e) {
        data["error"] = true;
        data["msg"] = e.toString();
    }
    return data;
}

exports = module.exports = function(req, res) {
    var data = req.body;

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Content-Type', 'application/json');

    if ("balance" in data) {
        var jsonRes = getBalance(data["balance"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else if ("rawtx" in data) {
        var jsonRes = sendRawTransaction(data["rawtx"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else if ("txdata" in data) {
        var jsonRes = getTransactionData(data["txdata"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else if ("txId" in data) {
        var jsonRes = getTransaction(data["txId"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else if ("estimatedGas" in data) {
        var jsonRes = getEstimatedGas(data["estimatedGas"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else if ("ethCall" in data) {
        var jsonRes = getEthCall(data["ethCall"]);
        res.write(JSON.stringify(jsonRes));
        res.end();
    } else {
        console.error('Invalid Request: ' + data);
        res.status(400).send();
    }
};
