var mongoose = require("mongoose");
var WxPayment = mongoose.models.WxPayment;
var utils = require("../../utils");

exports = module.exports = function (req, res) {
// { appid: 'wx31383e8595a69546',
//   bank_type: 'CFT',
//   cash_fee: '13',
//   fee_type: 'CNY',
//   is_subscribe: 'Y',
//   mch_id: '1218330301',
//   nonce_str: 'ppt0jbcejaq7',
//   openid: 'otYfzjn9BEPTMITI2Ikuv5y7Nas0',
//   out_trade_no: '14804101101049863',
//   result_code: 'SUCCESS',
//   return_code: 'SUCCESS',
//   sign: '8D0E675379112F8344D4C2C84B148CCE',
//   time_end: '20161129170155',
//   total_fee: '13',
//   trade_type: 'JSAPI',
//   transaction_id: '4006712001201611291191763215' }

    var return_success = function(){
        return res.send([
            "<xml>",
            "   <return_code><![CDATA[SUCCESS]]></return_code>",
            "   <return_msg><![CDATA[OK]]></return_msg>",
            "</xml>"
        ].join("\n"));
    }
    var return_fail = function(){
        return res.send([
            "<xml>",
            "   <return_code><![CDATA[FAIL]]></return_code>",
            "   <return_msg><![CDATA[FAIL]]></return_msg>",
            "</xml>"
        ].join("\n"));
    }
    if(utils.wxpay.notify_verify(req.body)){
        WxPayment.findOne()
            .where("transaction_id").equals(req.body.transaction_id)
            .exec(function(err, wxPayment){
                if(err){
                    console.log(err);
                    return return_fail();
                }
                if(!wxPayment){
                    wxPayment = new WxPayment();
                }
                var keys = Object.keys(req.body);
                for(var i=0; i<keys.length; i++){
                    var key = keys[i];
                    var value = req.body[key];
                    wxPayment[key] = value;
                }
                wxPayment.save(function(err){
                    if(err){
                        console.log(err);
                        return return_fail();
                    }
                    return return_success();
                });
            });
    }else{
        return return_fail();
    }
}