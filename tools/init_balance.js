module.exports = function (callback) {
    var accounts = web3.eth.accounts;
    
    function showBalances(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        console.log("Account #0 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[0]), "ether"));
        console.log("Account #1 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[1]), "ether"));
        cb();
    }
    
    function sendEther(from, to, ether, cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        transactionId = web3.eth.sendTransaction({from: from, to: to, value: web3.toWei(ether, "ether")});
        console.log("Send transaction Id: ", transactionId);
        cb();
    }
    
    showBalances();
    
    sendEther(accounts[0], accounts[9], 21267647932558653000);
    sendEther(accounts[1], accounts[9], 21267647932558653000);
    
    showBalances();
}