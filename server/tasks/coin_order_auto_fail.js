var CronJob = require('cron').CronJob;
var moment = require('moment');
var mongoose = require('mongoose');

new CronJob('10 */2 * * * *', function() {
        console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " coin order auto fail start");
        try{
            mongoose.models.CoinOrder.autoFail();
        }catch(e){
            console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " coin order auto fail failed: " + e);
        }
    }, function () {
        /* This function is executed when the job stops */
    },
    true, /* Start the job right now */
    null /* Time zone of this job. */
);