var request = require("request");
var querystring = require("querystring");
var settings = require("../../settings");


exports = module.exports = {
    mpapi_access_token_handler: function (req, res) {
        var payload = {
            'appid': settings.WECHAT_APP_ID,
            'secret': settings.WECHAT_APP_SECRET,
            'code': req.query.code || "",
            'grant_type': 'authorization_code',
        }
        request.get(
            'https://api.weixin.qq.com/sns/oauth2/access_token?' + querystring.stringify(payload),
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    return res.json(JSON.parse(body));
                };
                res.status(400).json({ 'detail': 'failed' });
            }
        );
    },
    mpapi_refresh_token_handler: function (req, res) {
        var payload = {
            'appid': settings.WECHAT_APP_ID,
            'grant_type': 'refresh_token',
            'refresh_token': req.query.refresh_token || "",
        }
        request.get(
            'https://api.weixin.qq.com/sns/oauth2/refresh_token?' + querystring.stringify(payload),
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    return res.json(JSON.parse(body));
                };
                res.status(400).json({ 'detail': 'failed' });
            }
        );
    },
    mpapi_userinfo_handler: function (req, res) {
        var payload = {
            'access_token': req.query.access_token || "",
            'openid': req.query.openid || "",
            'lang': req.query.lang || "zh_CN",
        }
        request.get(
            'https://api.weixin.qq.com/sns/userinfo?' + querystring.stringify(payload),
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    return res.json(JSON.parse(body));
                };
                res.status(400).json({ 'detail': 'failed' });
            }
        );
    },
}


