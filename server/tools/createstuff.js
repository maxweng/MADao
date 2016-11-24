var boot = require("../boot");

var mongoose = require('mongoose');

var User = mongoose.models.User;

var args = process.argv.slice(2);

boot(function(){
    if(args.length != 3){
        console.log("Usage: node createstuff.js name email password");
        process.exit(0);
    }else{
        var name = args[0];
        var email = args[1];
        var password = args[2];
        var user = new User({
            name: name,
            nickname: name,
            email: email,
            password: password,
            is_stuff: true,
            is_superuser: false
        });
        user.save(function(error) {
            if(error){
                console.log(error);
            }else{
                console.log("Stuff created successfully");
            }
            process.exit(0);
        });
    }
});