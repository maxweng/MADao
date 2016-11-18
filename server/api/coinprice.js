var mongoose = require("mongoose");
var CoinPrice = mongoose.models.CoinPrice;

exports = module.exports = function (req, res) {
    CoinPrice.getPrice("ethcny", function(err, advicedPrice){
        if(err){
            console.log(err);
            return res.status(500).send("something went wrong.");
        }
        res.json({
            "ethcny": advicedPrice
        });
    });
}