var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var request = require('request');
var utils = require("../../utils");

var PAYMENT_TYPE = "wxpay";

var wxPaymentSchema = new mongoose.Schema({
    payment_id: { type: String, unique: true },

    transaction_id: { type: String, unique: true },
    out_trade_no: { type: String, default: "" },
    trade_type: { type: String, default: "" },
    appid: { type: String, default: "" },
    mch_id: { type: String, default: "" },
    openid: { type: String, default: "" },
    device_info: { type: String, default: "" },
    
    is_subscribe: { type: String, default: "" },
    bank_type: { type: String, default: "" },
    total_fee: { type: Number },
    fee_type: { type: String, default: "" },
    cash_fee: { type: Number },
    cash_fee_type: { type: String, default: "" },
    coupon_fee: { type: Number },
    coupon_count: { type: Number },
    attach: { type: String, default: "" },
    time_end: { type: String, default: "" },
    
    out_refund_no: { type: String, default: "" },
    refund_status: { type: Number, default: 0 }, // 0: no need refund, 1: need refund, 4: refunding, 6: refund successfully, 8: refund failed
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

wxPaymentSchema.pre('save', function(next) {
    var self = this;
    self.payment_id = self.transaction_id;
    if(!self._id){
        next();
    }else{
        var needRefund = function(cb){
            if(self.refund_status == 0) self.refund_status = 1;
            cb();
        }
        if(self.out_trade_no && self.out_trade_no.length > 2){
            var model = utils.models.getModelByAttr("PAYMENT_IDENTIFY_CODE", self.out_trade_no.slice(0, 2));
            if(model){
                model.findOne()
                    .where("out_trade_no").equals(self.out_trade_no)
                    .exec(function(err, instance){
                        if(instance){
                            instance.paymentSuccess(PAYMENT_TYPE, self.transaction_id, function(err){
                                if(err) return needRefund(next);
                                return next();
                            });
                        }else{
                            return needRefund(next);
                        }
                    });
            }else{
                return needRefund(next);
            }
        }else{
            return needRefund(next);
        }
    }
});

wxPaymentSchema.post('save', function(doc, next) {
    if(doc.refund_status == 1) doc.refund();
    next();
});

wxPaymentSchema.methods.refund = function(cb){
    if(typeof(cb) === "undefined") cb = function(){};
    var self = this;
    if([0, 1].indexOf(self.refund_status) != -1){
        self.refund_status = 4;
        self.out_refund_no = "11" + (""+Date.now()) + (""+Math.ceil(Math.random() * 9000 + 1000));
        self.save(function(err){
            if(err) return cb(err);
            utils.wxpay.refund("", self.transaction_id, self.out_refund_no, self.total_fee, self.total_fee, function(err, res){
                if(err){
                    self.refund_status = 8;
                    return self.save(cb)
                }
                if(res.return_code.toUpperCase() == "SUCCESS"){
                    self.refund_status = 6;
                    return self.save(cb)
                }else{
                    self.refund_status = 8;
                    return self.save(cb)
                }
            });
        });
    }else{
        cb(new Error("refund status invalid"));
    }
}

wxPaymentSchema.plugin(uniqueValidator);

var WxPayment = mongoose.model('WxPayment', wxPaymentSchema);
WxPayment.PAYMENT_TYPE = PAYMENT_TYPE;