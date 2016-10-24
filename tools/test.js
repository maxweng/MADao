module.exports = function (callback) {
    var accounts = web3.eth.accounts;
    var mdc = MDC.deployed();
    
    function showBalances() {
        console.log("MDC Balance: ", web3.fromWei(+web3.eth.getBalance(mdc.address), "ether"));
        console.log("Account #0 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[0]), "ether"));
        console.log("Account #1 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[1]), "ether"));
    }
    
    function testChangeSettings(cb) {
        mdc.changeSettings(10, 5, 20, { from: accounts[0] }).then(function (transactionId) {
            console.log('Change settings transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function testSignUp(cb) {
        console.log("Claimer Address: ", accounts[0]);
        console.log("Recommender Address: ", accounts[1]);
        mdc.signUp("test123", accounts[1], { from: accounts[0], value: web3.toWei(50, "ether") }).then(function (transactionId) {
            console.log('Sign up transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    showBalances();
    testChangeSettings(function(){
        testSignUp(function(){
            showBalances();
        });
    });
}