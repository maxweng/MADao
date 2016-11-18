var mongoose = require("mongoose");
var User = mongoose.models.User;

exports = module.exports = function (req, res) {
    var resSuccess = function(){
        res.status(204).send();
    }
    var resError = function(){
        res.status(400).send("incorrect name or password.");
    }
    var name = req.body.name;
    var password = req.body.password;
    User.findOne()
        .where("name").equals(name)
        .exec(function(err, user){
            if(err) return resError();
            if(!user) return resError();
            if(user.random_password) return resError();
            if(user.authenticate(password)){
                req.session.regenerate(function(){
                    req.session.userId = ""+user._id;
                    return resSuccess();
                });
            }else{
                return resError();
            }
        });
}