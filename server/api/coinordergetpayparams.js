var mongoose = require("mongoose");
var CoinOrder = mongoose.models.CoinOrder;
var randomstring = require("randomstring");
var settings = require("../../settings");
var utils = require("../../utils");
var build_mysign = utils.wxpay.build_mysign;
var params_filter = utils.wxpay.params_filter;

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
                var params = {
                    appId: settings.WECHAT_APP_ID,
                    timeStamp: ""+(Math.floor(Date.now() / 1000)),
                    nonceStr: randomstring.generate({
                      length: 12,
                      charset: 'abcdefghijklmnopqrstuvwxyz0123456789'
                    }),
                    package: "prepay_id=" + unifiedOrder.prepay_id,
                    signType: "MD5",
                }
                var [_, prestr] = params_filter(params);
                var sign = build_mysign(prestr, settings.WECHAT_API_KEY);
                params.paySign = sign;
                res.json(params);
            });
        });
}