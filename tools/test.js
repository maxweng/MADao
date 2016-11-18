module.exports = function (callback) {
    var accounts = web3.eth.accounts;
    var mdc = MDC.deployed();
    
    var now = Date.now();
    
    var transInt = function(value){return +value};
    var transUtf8 = function(value){return web3.toUtf8(value)};
    var transString = function(value){return "" + value};
    var transEther = function(value){return +web3.fromWei(value, "ether")};
    var transBool = function(value){return !!value};
    
    var hexEncode = function(text){
        var hex, i;
    
        var result = "";
        for (i=0; i<text.length; i++) {
            hex = text.charCodeAt(i).toString(16);
            result += ("000"+hex).slice(-4);
        }
    
        return "0x" + result;
    }
    
    function showBalances(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        console.log("MDC Balance: ", web3.fromWei(+web3.eth.getBalance(mdc.address), "ether"));
        console.log("Account #0 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[0]), "ether"));
        console.log("Account #1 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[1]), "ether"));
        console.log("Account #2 Balance: ", web3.fromWei(+web3.eth.getBalance(accounts[2]), "ether"));
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
            ["totalUserAddresses", transInt],
            ["totalAvailableUserAddresses", transInt],
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
    
    function getFlights(address, cb){
        mdc.getFlightCount.call(address).then(function (count) {
            count = transInt(count);
            var flights = [];
            var work = function(i, work_cb){
                if(i >= count) return work_cb();
                mdc.flights.call(address, i).then(function (res) {
                    var flight = {
                        "_id": i,
                        "flightNumber": transUtf8(res[0]),
                        "departureTime": transInt(res[1]),
                        "queryNo": transString(res[2]),
                        "claimed": transBool(res[3]),
                    };
                    flights.push(flight);
                    i++;
                    work(i, work_cb);
                }).catch(function(err){
                    console.log(err);
                    process.exit();
                });
            }
            work(0, function(){
                cb(flights);
            });
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function getUserInfos(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        userInfos = [];
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
                        mdc.infoHashes.call(userAddress).then(function (res) {
                            var infoHash = transString(res[0]);
                            var available = transBool(res[1]);
                            getFlights(userAddress, function(flights){
                                userInfos.push({
                                    "_id": i,
                                    "address": userAddress,
                                    "balance": balance,
                                    "infoHash": infoHash,
                                    "available": available,
                                    "flights": flights
                                });
                                i++;
                                work(i, work_cb);
                            });
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
                console.log("MDC user infos: ", JSON.stringify(userInfos));
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
                mdc.claims.call(i).then(function (res) {
                    claims.push({
                        "_id": i,
                        "claimer": transString(res[0]),
                        "claimerName": transUtf8(res[1]),
                        "claimerCountry": transUtf8(res[2]),
                        "claimerId": transUtf8(res[3]),
                        "claimerNoncestr": transUtf8(res[4]),
                        "flightNumber": transUtf8(res[5]),
                        "departureTime": transInt(res[6]),
                        "oracleItId": transInt(res[7]),
                        "status": transInt(res[8]),
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
    
    function testSignUp(user, cb) {
        if(typeof(cb) === "undefined"){
            cb = user;
            user = null;
        }
        if(!user){
            user = {
                account: accounts[0],
                name: "test name",
                country: "China",
                id: hexEncode("310110198501081234"),
                noncestr: "a1seb25f5q",
                recommender: accounts[1],
            }
        }
        console.log("Claimer Address: ", user.account);
        console.log("Recommender Address: ", user.recommender);
        mdc.signUp(user.recommender, user.name, user.country, user.id, user.noncestr, { from: user.account, value: web3.toWei(1, "ether") }).then(function (transactionId) {
            console.log('Sign up transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }

    function testAddFlight(userFlight, cb) {
        if(typeof(cb) === "undefined"){
            cb = userFlight;
            userFlight = null;
        }
        if(!userFlight){
            userFlight = {
                user: {
                    account: accounts[0],
                    name: "test name",
                    country: "China",
                    id: hexEncode("310110198501081234"),
                    noncestr: "a1seb25f5q",
                    recommender: accounts[1],
                },
                flight: {
                    flightNumber: "FN8595",
                    departureTime: parseInt(now / 1000 + 3600)
                }
            }
        }
        mdc.addFlight(userFlight.flight.flightNumber, userFlight.flight.departureTime, { from: userFlight.user.account }).then(function (transactionId) {
            console.log('Add flight transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }

    function testClaim(userFlight, cb) {
        if(typeof(cb) === "undefined"){
            cb = userFlight;
            userFlight = null;
        }
        if(!userFlight){
            userFlight = {
                user: {
                    account: accounts[0],
                    name: "test name",
                    country: "China",
                    id: hexEncode("310110198501081234"),
                    noncestr: "a1seb25f5q",
                    recommender: accounts[1],
                },
                flight: {
                    flightNumber: "FN8595",
                    departureTime: parseInt(now / 1000 + 3600)
                }
            }
        }
        mdc.claim(userFlight.flight.flightNumber, userFlight.flight.departureTime, userFlight.user.name, userFlight.user.country, userFlight.user.id, userFlight.user.noncestr, { from: userFlight.user.account }).then(function (transactionId) {
            console.log('Claim transaction ID: ', '' + transactionId);
            cb();
        }).catch(function(err){
            console.log(err);
            process.exit();
        });
    }
    
    function testCaseSimple(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        testSignUp(function(){
            testAddFlight(function(){
                testClaim(cb);
            });
        });
    }
    
    function testCaseFull(cb) {
        if(typeof(cb) === "undefined") cb = function(){};
        
        var user1 = {
            account: accounts[0],
            name: "test name1",
            country: "China",
            id: hexEncode("310110198501081231"),
            noncestr: "a1seb25f51",
            recommender: accounts[3],
        }
        var user2 = {
            account: accounts[1],
            name: "test name2",
            country: "China",
            id: hexEncode("310110198501081232"),
            noncestr: "a1seb25f52",
            recommender: accounts[3],
        }
        var user3 = {
            account: accounts[2],
            name: "test name3",
            country: "China",
            id: hexEncode("310110198501081233"),
            noncestr: "a1seb25f53",
            recommender: "",
        }
        var flight1 = {
            flightNumber: "FN8591",
            departureTime: parseInt(now / 1000 + 3600) + 1
        }
        var flight2 = {
            flightNumber: "FN8592",
            departureTime: parseInt(now / 1000 + 3600) + 2
        }
        var userFlight1 = {
            user: user1,
            flight: flight1
        }
        var userFlight2 = {
            user: user1,
            flight: flight2
        }
        
        testSignUp(user1, function(){
            testSignUp(user2, function(){
                testSignUp(user3, function(){
                    showBalances();
                    getTotalInfo(function(){
                        testAddFlight(userFlight1, function(){
                            testAddFlight(userFlight2, function(){
                                testClaim(userFlight1, cb);
                            });
                        });
                    });
                });
            });
        });
    }
    
/*
    showBalances();
    getTotalInfo(function(totalInfo){
        testCaseSimple(function(){
            showBalances();
            getTotalInfo(process.exit);
        });
    });
*/

    showBalances();
    getTotalInfo(function(totalInfo){
        testCaseFull(function(){
            showBalances();
            getTotalInfo(process.exit);
        });
    });
}