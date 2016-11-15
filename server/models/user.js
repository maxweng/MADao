var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var userPlugin = require('mongoose-user');

var userSchema = new mongoose.Schema({
    name: { type: String, unique: true, default: '' },
    email: { type: String, default: '' },
    hashed_password: { type: String, default: '' },
    salt: { type: String, default: '' },
    is_superuser: { type: Boolean, default: false }
});

userSchema.plugin(userPlugin, {});
userSchema.plugin(uniqueValidator);

var User = mongoose.model('User', userSchema);