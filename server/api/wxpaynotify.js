var utils = require("../../utils");

exports = module.exports = function (req, res) {
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
    console.log(req.body);
    console.log(utils.wxpay.notify_verify(req.body));
    return return_fail();
}