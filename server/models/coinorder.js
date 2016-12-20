var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var mongoosePaginate = require('mongoose-paginate');
var request = require('request');
var utils = require('../../utils');
var web3 = utils.web3;
var settings = require('../../settings');

var PAYMENT_IDENTIFY_CODE = "11";

var coinOrderSchema = new mongoose.Schema({
    out_trade_no: { type: String, unique: true },
    payment_type: { type: String },
    payment_id: { type: String },
    transaction_id: { type: String },
    
    user_id: { type: String },
    address: { type: String },
    
    coin: { type: Number },
    coin_price: { type: Number },
    price: { type: Number },
    
    status: { type: Number, default: 0 }, // 0: init, 2: paied, 4: sent, 6: finished, 8: failed
    
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

coinOrderSchema.virtual('transaction').get(function () {
    if(!this.transaction_id) return null;
    return web3.eth.getTransaction(this.transaction_id);
});

coinOrderSchema.virtual('transactionIndex').get(function () {
    var trans = this.transaction;
    if(!trans) return null;
    return trans.transactionIndex;
});

coinOrderSchema.methods.paymentSuccess = function(payment_type, payment_id, cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    if(self.status != 0) return cb(new Error("status invalid"));
    self.payment_type = payment_type;
    self.payment_id = payment_id;
    self.status = 2;
    self.save(function(err){
        if(err) return cb(err);
        cb(null);
        self.sendCoin();
    });
}

coinOrderSchema.methods.checkTransaction = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    if([4, ].indexOf(self.status) != -1){
        var trans = self.transaction;
        if(trans.transactionIndex == null) return cb(null);
        if(trans.transactionIndex == 0){
            if(web3.eth.blockNumber - trans.blockNumber >= settings.VERIFY_BLOCK_NUMBER){
                self.status = 6;
                self.save(cb);
            }else{
                cb(null);
            }
        }else{
            self.fail(cb);
        }
    }else{
        cb(null);
    }
}

coinOrderSchema.methods.check = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    if([6, 8].indexOf(self.status) == -1){
        if(Date.now() - (+self.createdAt) > 1000 * 60 * 15){
            self.fail(function(err){
                cb(err, false);
            });
        }else{
            cb(null, true);
        }
    }else{
        cb(null, true);
    }
}

coinOrderSchema.methods.sendCoin = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    self.check(function(err, canSend){
        if(!canSend) return cb(new Error("can not send coin"));
        web3.eth.sendTransaction({
                from: settings.sysAccountAddress,
                to: self.address,
                value: web3.toWei(self.coin, "ether"),
                gas: settings.DEFAULT_GAS,
                gasPrice: settings.DEFAULT_GAS_PRICE,
            }, function(err, transaction_id){
                if(err){
                    console.log(err);
                    self.fail(function(){
                        cb(err);
                    });
                    return false;
                }
                self.status = 4;
                self.transaction_id = transaction_id;
                self.save(cb);
        });
    });
}

coinOrderSchema.methods.fail = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    if([0, 2, 4].indexOf(self.status) != -1){
        var doFail = function(){
            self.status = 8;
            self.save(cb);
        }
        if(self.payment_type && self.payment_id){
            var model = utils.models.getModelByAttr("PAYMENT_TYPE", self.payment_type);
            if(model){
                model.findOne()
                    .where("payment_id").equals(self.payment_id)
                    .exec(function(err, instance){
                        if(instance){
                            instance.refund();
                        }
                        return doFail();
                    });
            }else{
                return doFail();
            }
        }else{
            return doFail();
        }
    }else{
        return cb(new Error("status invalid"));
    }
}

coinOrderSchema.methods.getUnifiedOrder = function(openid, cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    utils.wxpay.getUnifiedOrder("JSAPI", self.out_trade_no, self.price * 100, settings.SITE_NAME_CN, "127.0.0.1", "", openid, function(err, res){
        if(err) return cb(err);
        cb(null, res);
    });
}

coinOrderSchema.statics.create = function(user, address, coin, cb){
    if(typeof(cb) === "undefined") cb = function(){};
    coin = +coin;
    if(!coin || coin <= 0) return cb(new Error("coin invalid"));
    mongoose.models.CoinPrice.getPrice("ethcny", function(err, advicedPrice){
        if(err) return cb(err);
        var coin_price = advicedPrice;
        var price = coin * coin_price;
        price = Math.ceil(price * 100) / 100;
        if(!price || price < 0.01) return cb(new Error("price invalid"));
        coinOrder = new CoinOrder();
        coinOrder.user_id = ""+user._id;
        coinOrder.address = address;
        coinOrder.coin = coin;
        coinOrder.coin_price = coin_price;
        coinOrder.price = price;
        coinOrder.out_trade_no = PAYMENT_IDENTIFY_CODE + (""+Date.now()) + (""+Math.ceil(Math.random() * 9000 + 1000));
        coinOrder.save(function(err){
            if(err) return cb(err);
            cb(null, coinOrder);
        });
    });
}

coinOrderSchema.statics.autoFail = function(){
    CoinOrder.find()
        .where("status").nin([6, 8])
        .exec(function(err, instances){
            if(err) return false;
            for(var i=0; i<instances.length; i++){
                instances[i].check();
            }
        });
}

coinOrderSchema.statics.autoCheckTransaction = function(){
    CoinOrder.find()
        .where("status").equals(4)
        .exec(function(err, instances){
            if(err) return false;
            for(var i=0; i<instances.length; i++){
                instances[i].checkTransaction();
            }
        });
}

coinOrderSchema.plugin(mongoosePaginate);
coinOrderSchema.plugin(uniqueValidator);

var CoinOrder = mongoose.model('CoinOrder', coinOrderSchema);
CoinOrder.PAYMENT_IDENTIFY_CODE = PAYMENT_IDENTIFY_CODE;