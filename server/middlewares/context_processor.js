var settings = require("../../settings");

exports = module.exports = function(req, res, next) {
    res.locals.WECHAT_APP_ID = settings.WECHAT_APP_ID;
    next();
};