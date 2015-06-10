var fs = require('fs');
var p = require('path');
var pjson = require(p.resolve('./package.json'));
var nonClosureDeps = pjson.config.nonClosureDeps;
var closureDepsFolder = './generatedDeps';

var filename = function(namespace) {
    var subtree = namespace.split('.');
    subtree[subtree.length - 1] += '.js';
    var pathParts = [p.resolve(closureDepsFolder)].concat(subtree);
    return p.join.apply(p, pathParts);
};

var mkdirs = function(path) {
    var dirname = p.dirname(path);
    if (dirname != p.sep) {
        mkdirs(dirname);
    }
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
};

var closureify = function(namespace) {
    var header = "goog.provide('" + namespace + "');(function(){var window={};";
    var footer = namespace + '=window.' + nonClosureDeps[namespace].obj +
        ';}());';
    fs.readFile(nonClosureDeps[namespace].path, 'utf8', function(err, data) {
        if (err) {
            console.log(err);
            return;
        }
        var closureified = header + data + footer;
        var path = filename(namespace);
        mkdirs(p.dirname(path));
        fs.writeFile(path, closureified, {flag: 'w'}, function(err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Provided ' + namespace + ' sucessfully.');
        });
    });
};

Object.keys(nonClosureDeps).map(closureify);