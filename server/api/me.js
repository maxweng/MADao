var mongoose = require("mongoose");
var User = mongoose.models.User;

exports = module.exports = function (req, res) {
    var fieldNames = ["wechat_openid", "address", "encrypted_wallet_key"];
    var getResponse = function(){
        var resJSON = {};
        for(var i=0; i<fieldNames.length; i++){
            var fieldName = fieldNames[i];
            resJSON[fieldName] = req.user[fieldName];
        }
        res.json(resJSON);
    }
    if(req.method == "POST"){
        for(var i=0; i<fieldNames.length; i++){
            var fieldName = fieldNames[i];
            req.user[fieldName] = req.body[fieldName] || "";
        }
        req.user.save(function(err){
            if(err) return res.status(500).send("something went wrong.");
            return getResponse();
        });
    }else{
        return getResponse();
    }
}