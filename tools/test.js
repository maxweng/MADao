module.exports = function (callback) {
    var accounts = web3.eth.accounts;
    var mdc = MDC.deployed();
    
    var transInt = function(value){return +value};
    var transUtf8 = function(value){return web3.toUtf8(value)};
    var transString = function(value){return "" + value};
    var transEther = function(value){return +web3.fromWei(value, "ether")};
    
    function showBalances(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        console.log("MDC Balance: ", web3.fromWei(+web3.eth.getBalance(mdc.address), "ether"));
        console.log("Account #0 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[0]), "ether"));
        console.log("Account #1 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[1]), "ether"));
        cb();
    }

    function getVariable(variableName, cb) {
        mdc[variableName].call().then(function (value) {
            cb(value);
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function getInfo(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        var info = {};
        var variables = [
            ["organizer", transString],
            ["maxOperatingCharge", transEther],
            ["recommendationRewardRate", transInt],
            ["operatingChargeRate", transInt],
            ["claimFee", transInt],
            ["status", transInt],
            ["totalBalances", transEther],
            ["operatingChargeBalance", transEther],
            ["totalUserAddresses", transInt],
            ["totalClaims", transInt],
        ];
        var work = function(i, work_cb){
            if(i >= variables.length){
                return work_cb();
            }
            var veriableName = variables[i][0];
            var transFunc = variables[i][1];
            getVariable(veriableName, function(value){
                info[veriableName] = transFunc(value);
                i++;
                work(i, work_cb);
            });
        }
        work(0, function(){
            console.log("MDC info: ", info);
            cb(info);
        });
    }
    
    function getUserInfos(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        userInfos = {};
        getVariable("totalUserAddresses", function(totalUserAddresses){
            totalUserAddresses = +totalUserAddresses;
            var work = function(i, work_cb){
                if(i > totalUserAddresses){
                    return work_cb();
                }
                mdc.userAddresses.call(i).then(function (userAddress) {
                    userAddress = "" + userAddress;
                    mdc.balances.call(userAddress).then(function (balance) {
                        balance = transEther(balance);
                        mdc.infoHashes.call(userAddress).then(function (infoHash) {
                            infoHash = transUtf8(infoHash);
                            userInfos[userAddress] = {
                                "balance": balance,
                                "infoHash": infoHash
                            }
                            i++;
                            work(i, work_cb);
                        }).catch(function(err){
                            console.log(err);
                            process.exit();
                        });
                    }).catch(function(err){
                        console.log(err);
                        process.exit();
                    });
                }).catch(function(err){
                    console.log(err);
                    process.exit();
                });
            }
            work(1, function(){
                console.log("MDC user infos: ", userInfos);
                cb(userInfos);
            });
        });
    }
    
    function getClaims(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        claims = [];
        getVariable("totalClaims", function(totalClaims){
            totalClaims = +totalClaims;
            var work = function(i, work_cb){
                if(i > totalClaims){
                    return work_cb();
                }
                mdc.getClaim.call(i).then(function (res) {
                    claims.push({
                        "_id": i,
                        "claimer": transString(res[0]),
                        "reason": transUtf8(res[1]),
                        "status": transInt(res[2]),
                        "userInfo": {
                            "name": transUtf8(res[3]),
                            "country": transUtf8(res[4]),
                            "id": transUtf8(res[5]),
                            "birthdate": transInt(res[6]),
                            "phone": transUtf8(res[7]),
                            "email": transUtf8(res[8]),
                            "timestamp": transInt(res[9]),
                            "noncestr": transUtf8(res[10])
                        }
                    });
                    i++;
                    work(i, work_cb);
                }).catch(function(err){
                    console.log(err);
                    process.exit();
                });
            }
            work(1, function(){
                console.log("MDC claims: ", claims);
                cb(claims);
            });
        });
    }
    
    function getTotalInfo(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        getInfo(function(info){
            getUserInfos(function(userInfos){
                getClaims(function(claims){
                    cb({
                        "info": info,
                        "userInfos": userInfos,
                        "claims": claims
                    });
                });
            });
        });
    }
    
    function testChangeSettings(cb) {
        mdc.changeSettings(10, 15, 20, { from: accounts[0] }).then(function (transactionId) {
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
        mdc.signUp("_test123", accounts[1], { from: accounts[0], value: web3.toWei(100, "ether") }).then(function (transactionId) {
            console.log('Sign up transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function testClaim(cb) {
        mdc.claim("_test name", "_test country", "_310110198501081234", 1477306442735, "_13521234567", "_test@test.test", 1477306474088, "_a1seb25f5q", "_I Need Money", { from: accounts[0] }).then(function (transactionId) {
            console.log('Claim transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function testInvestigateClaim(claimId, cb) {
        mdc.investigateClaim(claimId, web3.toWei(1, "ether"), { from: accounts[0] }).then(function (transactionId) {
            console.log('Investigate Claim transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }

    function testPassClaim(claimId, cb) {
        mdc.passClaim(claimId, 10, web3.toWei(100, "ether"), { from: accounts[0] }).then(function (transactionId) {
            console.log('Pass Claim transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    showBalances();
    testChangeSettings(function(){
        getTotalInfo(function(totalInfo){
            testSignUp(function(){
                showBalances();
                testClaim(function(){
                    getTotalInfo(function(totalInfo){
                        testInvestigateClaim(totalInfo.info.totalClaims, function(){
                            showBalances();
                            getTotalInfo(function(totalInfo){
                                testPassClaim(totalInfo.info.totalClaims, function(){
                                    showBalances();
                                    getTotalInfo(function(totalInfo){
                                        process.exit();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}