// Load `*.js` and `*.json` under current directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync(__dirname + '/').forEach(function(file) {
  if (file && file.match(/\.js(on)?$/) && file !== 'index.js' && file[0] != "_") {
    var name = file.replace('.js', '');
    exports[name] = require('./' + file);
  }
});