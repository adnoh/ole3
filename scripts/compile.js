var cc = require('closure-compiler');
var glob = require('glob');
var p = require('path');
var resolve = p.resolve.bind(p, __dirname);
var fs = require('fs');
var options = require('./config.js').getCompileOptions();
options['jar'] = resolve('../node_modules/google-closure-compiler/compiler.jar');

var afterCompile = function(err, stdout, stderr) {
    if (err) throw err;
    fs.writeFileSync(resolve('../dist/ole3.js'), stdout, {'flag': 'w'});
};

process.chdir(resolve('../'));

cc.compile(null, options, afterCompile);
