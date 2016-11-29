var mongoose = require("mongoose");
var CoinOrder = mongoose.models.CoinOrder;

exports = module.exports = function (req, res) {
    var out_trade_no = req.query.out_trade_no || "";
    var page = +req.query.page || 1;
    var queryDict = {
        user_id: req.user._id
    };
    if(out_trade_no) queryDict.out_trade_no = out_trade_no;
    
    var return_res = function(){
        CoinOrder.paginate(queryDict, {
            page: page,
            limit: 20,
            sort: "-createdAt"
        }, function(err, result) {
            if(err) return res.status(500).json({"detail": "something went wrong."});
            res.json(result);
        });
    }
    
    if(req.method == "POST"){
        var address = req.body.address || req.user.address || "";
        if(!address) return res.status(400).json({"detail": "invalid address."});
        var coin = +req.body.coin || 0;
        if(coin <= 0) return res.status(400).json({"detail": "invalid coin."});
        CoinOrder.create(req.user, address, coin, function(err, coinOrder){
            if(err) return res.status(400).json({"detail":"something went wrong."});
            return res.json(coinOrder);
        });
    }else{
        return return_res();
    }
}