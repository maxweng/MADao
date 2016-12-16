var mongoose = require("mongoose");
var User = mongoose.models.User;

exports = module.exports = function (req, res) {
    var editableFieldNames = ["address", "encrypted_wallet_key", "nickname", "header", "real_name", "country", "id_no"];
    var readOnlyFieldNames = ["wechat_openid"];
    var fieldNames = editableFieldNames.concat(readOnlyFieldNames);
    var getResponse = function(){
        var resJSON = {};
        for(var i=0; i<fieldNames.length; i++){
            var fieldName = fieldNames[i];
            resJSON[fieldName] = req.user[fieldName];
        }
        res.json(resJSON);
    }
    if(req.method == "POST"){
        for(var i=0; i<editableFieldNames.length; i++){
            var fieldName = editableFieldNames[i];
            req.user[fieldName] = req.body[fieldName] || "";
        }
        req.user.save(function(err){
            if(err) return res.status(500).json({"detail": "something went wrong."});
            return getResponse();
        });
    }else{
        return getResponse();
    }
}