var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var _ = require('lodash');

var pid = "";
try{
    pid = fs.readFileSync(path.resolve(__dirname, '../.pid'));
}catch(e){
    console.log("not running");
}

exec('ps aux | grep ' + pid, function(error, stdout, stderr) {
    _.each(stdout.split("\n"), function(line){
        if(line.indexOf("node") != -1){
            var new_pid = line.trim().replace(/ +/g, " ").split(" ")[1];
            if(new_pid == pid){
                exec('kill -9 ' + pid, function(error, stdout, stderr) {
                    console.log("Sucide!");
                });
            }
        };
    });
});