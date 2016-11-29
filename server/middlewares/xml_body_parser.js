var parser = require('xml2json');

exports = module.exports = function(req, res, next){
    var data = "";
    if(req._body) return next();
    req.on('data', function(chunk){ data += chunk});
    req.on('end', function(){
        req.rawBody = data;
        try{
            req.body = JSON.parse(parser.toJson(data)).xml;
        }catch(e){
            console.log(e);
            req.body = data;
        }
        next();
    });
};