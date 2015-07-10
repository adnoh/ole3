var fs = require('fs');
var p = require('path');
var async = require('async');
var externs = require('../node_modules/openlayers/tasks/generate-externs');
var olExternsFile = p.resolve('./externs/openlayers/ol.js');

var mkdirs = function(path) {
    var dirname = p.dirname(path);
    if (dirname != p.sep) {
        mkdirs(dirname);
    }
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
};

var getOlExterns = function(callback) {
    externs(callback);
};

var writeOlExterns = function(externs, callback) {
    mkdirs(p.dirname(olExternsFile));
    fs.writeFile(olExternsFile, externs, {flag: 'w'}, function(err) {
        callback(err, olExternsFile);
    });
};

var buildWithoutOl = function(olExternsFile, callback) {
    build(withutOlConfig, withutOlOutput, callback);
};

async.waterfall([
    getOlExterns,
    writeOlExterns
    ], function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Generated closure externs.');
        }
    });
