var mongoose = require("mongoose");

var getModelByAttr = function(attrName, attrValue){
    var keys = Object.keys(mongoose.models);
    for(var i=0; i<keys.length; i++){
        var key = keys[i];
        var model = mongoose.models[key];
        var attr = model[attrName];
        if(attr){
            if(typeof(attrValue) !== "undefined"){
                if(attr == attrValue) return model;
            }else{
                return model;
            }
        }
    }
    return null;
}

exports = module.exports = {
    getModelByAttr: getModelByAttr
};
