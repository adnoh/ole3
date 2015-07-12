var cc = require('closure-compiler');
var glob = require('glob');
var p = require('path');
var resolve = p.resolve.bind(p, __dirname);
var fs = require('fs');
var options = require('./config.js').getCompileOptions();
var utils = require('./utils.js');
options['jar'] = utils.relInPackage('google-closure-compiler', 'compiler.jar');

var mkdirs = function(path) {
    var dirname = p.dirname(path);
    if (dirname != p.sep) {
        mkdirs(dirname);
    }
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
};

var afterCompile = function(err, stdout, stderr) {
    if (err) throw err;
};

process.chdir(resolve('../'));

cc.compile(null, options, afterCompile);
