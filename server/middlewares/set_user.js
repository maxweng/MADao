var mongoose = require("mongoose");
var User = mongoose.models.User;

exports = module.exports = function(req, res, next) {
    req.user = null;
    var callNext = function(){
        res.locals.user = req.user;
        next();
    }
    if(req.session.userId){
        User.findById(req.session.userId)
            .exec(function(err, user){
                if(user) req.user=user
                callNext();
            });
    }else{
        callNext();
    }
};