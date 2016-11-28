var request = require("request");
var querystring = require('querystring');

exports = module.exports = function(req, res, next){
    payload = {
        'access_token': req.query.access_token || "",
        'openid': req.query.openid || "",
        'lang': req.query.lang || "zh_CN",
    };
    request.get(
        'https://api.weixin.qq.com/sns/userinfo?' + querystring.stringify(payload),
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.openid){
                    req.wechat_user_info = info;
                    next();
                    return;
                };
            };
            res.status(400).json({ 'detail': 'access_token or openid invalid' });
        }
    );
};