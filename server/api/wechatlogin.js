var mongoose = require("mongoose");
var User = mongoose.models.User;
var randomstring = require("randomstring");

exports = module.exports = function (req, res) {
    var openid = req.wechat_user_info.openid;
    var unionid = req.wechat_user_info.unionid;
    var source = req.query.source;
    var query_cb = function(err, users){
        var user = users[0];
        var do_login = function(err){
            req.session.regenerate(function(){
                req.session.userId = ""+user._id;
                return res.status(204).send();
            });
        }
        if(user){
            do_login();
        }else{
            user = new User({
                name: openid,
                email: openid,
                nickname: req.wechat_user_info.nickname,
                password: randomstring.generate(64),
                header: req.wechat_user_info.headimgurl,
                wechat_openid: openid,
                random_password: true
            });
            user.save(do_login);
        };
    }
    User.find()
        .where('wechat_openid').equals(openid)
        .exec(query_cb);
}