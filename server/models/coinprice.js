var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var request = require('request');

var coinPriceSchema = new mongoose.Schema({
    tickerId: { type: String, unique: true },
    at: { type: Number },
    buy: { type: Number },
    sell: { type: Number },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

coinPriceSchema.virtual('advicedPrice').get(function () {
    return Math.ceil(this.sell * 1.1 * 100) / 100;
});

coinPriceSchema.statics.getPrice = function(tickerId, cb){
    if(typeof(cb) === "undefined") cb = function(){};
    CoinPrice.findOne()
        .where("tickerId").equals(tickerId)
        .exec(function(err, coinPrice){
            if(err) return cb(err);
            if(coinPrice && coinPrice.at + 60 > Date.now() / 1000){
                return cb(null, coinPrice.advicedPrice);
            }
            CoinPrice.refreshAll(function(err){
                if(err) return cb(err);
                CoinPrice.findOne()
                    .where("tickerId").equals(tickerId)
                    .exec(function(err, coinPrice){
                        if(err) return cb(err);
                        if(!coinPrice) return cb(new Error("can not get ticker"));
                        return cb(null, coinPrice.advicedPrice);
                    });
            });
        });
}

coinPriceSchema.statics.refreshAll = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var baseWork = function(try_times){
        if(try_times > 3) return cb(new Error("try too much"));
        var retry = function(){
            try_times++;
            setTimeout(function(){
                baseWork(try_times);
            }, try_times * 200);
        }
        request({
            url: "https://yunbi.com/api/v2/tickers",
            method: "GET"
        }, function(err, response, body){
            if(err) return cb(err);
            if (response.statusCode == 200) {
                try{
                    var res = JSON.parse(body);
                }catch(err){
                    return cb(err);
                }
                var keys = Object.keys(res);
                var work = function(i, work_cb){
                    if(i >= keys.length) return work_cb(null);
                    var next_work = function(){
                        i++;
                        work(i, work_cb);
                    }
                    var tickerId = keys[i];
                    if(!tickerId) next_work();
                    var ticker = res[tickerId];
                    var at = ticker.at;
                    if(!at) next_work();
                    var buy = +ticker.ticker.buy;
                    if(!buy) next_work();
                    var sell = +ticker.ticker.sell;
                    if(!sell) next_work();
                    
                    CoinPrice.findOne()
                        .where("tickerId").equals(tickerId)
                        .exec(function(err, coinPrice){
                            if(err) return work_cb(err);
                            if(!coinPrice){
                                coinPrice = new CoinPrice();
                                coinPrice.tickerId = tickerId;
                            }
                            coinPrice.at = at;
                            coinPrice.buy = buy;
                            coinPrice.sell = sell;
                            coinPrice.save(function(err){
                                if(err) return cb(err);
                                next_work();
                            });
                        });
                }
                work(0, cb);
            }else{
                return retry();
            }
        });
    }
    baseWork(0);
}

coinPriceSchema.plugin(uniqueValidator);

var CoinPrice = mongoose.model('CoinPrice', coinPriceSchema);