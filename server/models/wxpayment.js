var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var request = require('request');
var utils = require("../../utils");

var wxPaymentSchema = new mongoose.Schema({
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
    
    refund_status: { type: Number, default: 0 }, // 0: no need refund, 1: need refund, 4: refunding, 6: refund successfully, 8: refund failed
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

wxPaymentSchema.pre('save', function(next) {
    var self = this;
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
                            instance.paymentSuccess(function(err){
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
    var self = this;
    if([0, 1].indexOf(self.refund_status) != -1){
        self.refund_status = 4;
        self.save(cb);
        
        
    }else{
        cb(new Error("refund status invalid"));
    }
}

wxPaymentSchema.plugin(uniqueValidator);

var WxPayment = mongoose.model('WxPayment', wxPaymentSchema);