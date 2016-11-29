var mongoose = require("mongoose");
var CoinOrder = mongoose.models.CoinOrder;

exports = module.exports = function (req, res) {
    var out_trade_no = req.query.out_trade_no || "";
    if(!out_trade_no) return res.status(400).json({"detail": "out_trade_no required."});
    CoinOrder.findOne()
        .where("user_id").equals(req.user._id)
        .where("out_trade_no").equals(out_trade_no)
        .exec(function(err, coinOrder){
            if(err) return res.status(500).json({"detail": "something went wrong."});
            if(!coinOrder) return res.status(400).json({"detail": "no such coin order."});
            coinOrder.getUnifiedOrder(req.wechat_user_info.openid, function(err, unifiedOrder){
                if(err) return res.status(500).json({"detail": "something went wrong."});
                res.json(unifiedOrder);
            });
        });
}