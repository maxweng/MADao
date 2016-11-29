var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var mongoosePaginate = require('mongoose-paginate');
var request = require('request');
var utils = require('../../utils');
var web3 = utils.web3;
var settings = require('../../settings');

var coinOrderSchema = new mongoose.Schema({
    out_trade_no: { type: String, unique: true },
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

coinOrderSchema.virtual('transactionIndex').get(function () {
    if(!this.transaction_id) return null;
    var trans = web3.eth.getTransaction(this.transaction_id);
    if(!trans) return null;
    return trans.transactionIndex;
});

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
        coinOrder.out_trade_no = (""+Date.now()) + (""+Math.ceil(Math.random() * 9000 + 1000));
        coinOrder.save(function(err){
            if(err) return cb(err);
            cb(null, coinOrder);
        });
    });
}

coinOrderSchema.plugin(mongoosePaginate);
coinOrderSchema.plugin(uniqueValidator);

var CoinOrder = mongoose.model('CoinOrder', coinOrderSchema);