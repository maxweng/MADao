var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var request = require('request');

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
    
    refunded: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

wxPaymentSchema.plugin(uniqueValidator);

var WxPayment = mongoose.model('WxPayment', wxPaymentSchema);