var settings = require("../settings");
var randomstring = require("randomstring");
var request = require("request");
var parser = require('xml2json');
var md5 = require("./md5");

var UNIFIEDORDER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder";
var REFUND_URL = "https://api.mch.weixin.qq.com/secapi/pay/refund";

var build_mysign = function(prestr, key){
    return md5(prestr + "&key=" + key).toUpperCase();
}

var params_filter = function(params, except_keys){
    if(typeof(except_keys) === "undefined") except_keys = [];
    ks = Object.keys(params);
    ks.sort();
    var newparams = {};
    var prestr = '';
    for(var i=0; i<ks.length; i++){
        var k = ""+ks[i];
        var v = ""+params[k];
        if(except_keys.indexOf(k) == -1 && v != ""){
            newparams[k] = v;
            prestr += k + "=" + v + "&";
        }
    }
    prestr = prestr.slice(0, prestr.length - 1);
    return [newparams, prestr];
}

var notify_verify = function(post_data){
    if (post_data.result_code.toUpperCase() != "SUCCESS") return false;
    
    var trade_type = post_data.trade_type;
    
    var [_, prestr] = params_filter(post_data, except_keys=["sign"])
    
    var mysign = "";
    if(trade_type == "JSAPI"){
        mysign = build_mysign(prestr, settings.WECHAT_API_KEY);
    }else if(trade_type == "APP"){
        mysign = build_mysign(prestr, settings.WECHAT_OPEN_API_KEY);
    }else{
        return false;
    }
    
    if(mysign != post_data.sign) return false;
    return true;
}

var getUnifiedOrder = function(trade_type, out_trade_no, total_fee, body, spbill_create_ip, attach, openid, cb){
    var res = [];
    var params = {};
    var append_res = function(key, value){
        res.push("    <" + key + ">" + value + "</" + key + ">");
        params[key] = value;
    }
    if(trade_type == "JSAPI"){
        append_res("appid", settings.WECHAT_APP_ID);
    }else if(trade_type == "APP"){
        append_res("appid", settings.WECHAT_OPEN_APP_ID);
    }
    if(attach){
        append_res("attach", attach);
    }
    append_res("body", body);
    if(trade_type == "JSAPI"){
        append_res("mch_id", +settings.WECHAT_MCH_ID);
    }else if(trade_type == "APP"){
        append_res("mch_id", +settings.WECHAT_OPEN_MCH_ID);
    }
    var nonce_str = randomstring.generate({
      length: 12,
      charset: 'abcdefghijklmnopqrstuvwxyz0123456789'
    });
    append_res("nonce_str", nonce_str);
    append_res("notify_url", settings.WXPAY_NOTIFY_URL);
    if(openid){
        append_res("openid", openid);
    }
    append_res("out_trade_no", out_trade_no);
    append_res("spbill_create_ip", spbill_create_ip);
    append_res("total_fee", +total_fee);
    append_res("trade_type", trade_type);
    var [_, prestr] = params_filter(params);
    var sign = "";
    if(trade_type == "JSAPI"){
        sign = build_mysign(prestr, settings.WECHAT_API_KEY);
    }else if(trade_type == "APP"){
        sign = build_mysign(prestr, settings.WECHAT_OPEN_API_KEY);
    }
    append_res("sign", sign);
    var data = "<xml>\n" + res.join("\n") + "\n</xml>";
    request.post({
            url: UNIFIEDORDER_URL,
            body: data,
            cert: settings.WECHAT_CERTS_CERT,
            key: settings.WECHAT_CERTS_KEY,
            ca: settings.WECHAT_CERTS_CA,
        },
        function (error, response, body) {
            if(error) return cb(error);
            if(response.statusCode != 200) return cb(new Error("status code: ") + response.statusCode);
            var res = JSON.parse(parser.toJson(body)).xml;
            cb(null, res);
        }
    );
}

var refund = function(out_trade_no, transaction_id, out_refund_no, total_fee, refund_fee, cb){
    // out_trade_no and transaction_id only need one
    var res = [];
    var params = {};
    var append_res = function(key, value){
        res.push("    <" + key + ">" + value + "</" + key + ">");
        params[key] = value;
    }
    append_res("appid", settings.WECHAT_APP_ID);
    append_res("mch_id", settings.WECHAT_MCH_ID);
    append_res("nonce_str", randomstring.generate({
      length: 12,
      charset: 'abcdefghijklmnopqrstuvwxyz0123456789'
    }));
    append_res("op_user_id", settings.WECHAT_MCH_ID);
    append_res("out_refund_no", out_refund_no);
    append_res("out_trade_no", out_trade_no);
    append_res("refund_fee", refund_fee);
    append_res("total_fee", total_fee);
    append_res("transaction_id", transaction_id);
    var [_, prestr] = params_filter(params);
    var sign = build_mysign(prestr, settings.WECHAT_API_KEY);
    append_res("sign", sign);
    var data = "<xml>\n" + res.join("\n") + "\n</xml>";
    request.post({
            url: REFUND_URL,
            body: data,
            cert: settings.WECHAT_CERTS_CERT,
            key: settings.WECHAT_CERTS_KEY,
            ca: settings.WECHAT_CERTS_CA,
        },
        function (error, response, body) {
            if(error) return cb(error);
            if(response.statusCode != 200) return cb(new Error("status code: ") + response.statusCode);
            var res = JSON.parse(parser.toJson(body)).xml;
            cb(null, res);
        }
    );
}

exports = module.exports = {
    build_mysign: build_mysign,
    params_filter: params_filter,
    notify_verify: notify_verify,
    getUnifiedOrder: getUnifiedOrder,
    refund: refund
};
