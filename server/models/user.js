var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var userPlugin = require('mongoose-user');

var userSchema = new mongoose.Schema({
    name: { type: String, unique: true, default: '' },
    email: { type: String, default: '' },
    hashed_password: { type: String, default: '' },
    salt: { type: String, default: '' },
    nickname: { type: String, default: '' },
    header: { type: String, default: '' },
    wechat_openid: { type: String, default: '' },
    
    real_name: { type: String, default: '' },
    country: { type: String, default: '' },
    id_no: { type: String, default: '' },
    
    random_password: { type: Boolean, default: false },
    
    is_stuff: { type: Boolean, default: false },
    is_superuser: { type: Boolean, default: false },
    
    address: { type: String, default: '' },
    encrypted_wallet_key: { type: String, default: '' },
});

userSchema.plugin(userPlugin, {});
userSchema.plugin(uniqueValidator);

var User = mongoose.model('User', userSchema);