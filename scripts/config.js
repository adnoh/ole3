var p = require('path');
var pjson = require(p.resolve('./package.json'));
var glob = require('glob');
var resolve = p.resolve.bind(p, __dirname);

var getCss = function() {
    var css = [];
    return Object.keys(pjson.config.libs).map(function(key) {
        return pjson.config.libs[key].css;
    }).filter(function(css) {return !!css; });
};

var globArray = function(arr) {
    if (arr && arr.map) {
        arr = arr.map(function(g) {
            return glob.sync(g, {
                cwd: resolve(p.join(__dirname, '..'))
            });
        });
        arr = flatten(arr);
    }
    return arr;
};

var flatten = function(arr) {
    var flat = [];
    arr.map(function(el) {
        if (el && el.map) {
            flat = flat.concat(flatten(el));
        } else {
            flat.push(el);
        }
    });
    return flat;
};

var getStatics = function() {
    var statics = getRelativeDistJs(pjson.config.compile.statics);
    statics.push.apply(statics, resolveGlobsRelative(pjson.config.js));
    return statics;
};

var getDynamics = function() {
    return getRelativeDistJs(pjson.config.compile.externs);
};

var getRelativeDistJs = function(libs) {
    jsGlobs = libs.map(function(key) {
        lib = pjson.config.libs[key];
        if (lib.distjs) { return lib.distjs; }
        return lib.js;
    });
    return resolveGlobsRelative(jsGlobs);
};

var getAbsoluteJs = function(libs) {
    jsGlobs = libs.map(function(key) {
        lib = pjson.config.libs[key];
        return lib.js;
    });
    return globArray(jsGlobs);
};

var getAbsoluteExtern = function(libs) {
    jsGlobs = libs.map(function(key) {
        lib = pjson.config.libs[key];
        return lib.externs;
    });
    return globArray(flatten(jsGlobs));
};

var resolveGlobsRelative = function(globs) {
    return globArray(globs).map(function(absPath) {
        return absPath.replace(resolve('../') + '/', '');
    });
};

var getServerOptions = function() {
    return {
        dynamic: getDynamics(),
        statics: getStatics(),
        css: getCss(),
        dist: pjson.config.dist,
        deps: pjson.config.deps,
        main: pjson.config.main
    };
};

var getCompileOptions = function() {
    var opt = pjson.config.compile;
    statics = opt.statics;
    delete opt.statics;
    externs = opt.externs;
    delete opt.externs;
    opt.js = getAbsoluteJs(statics);
    opt.js.push.apply(opt.js, globArray(pjson.config.js));
    opt.externs = getAbsoluteExtern(externs);
    opt.js_output_file = resolve(p.join('..', pjson.config.dist));
    return opt;
};

module.exports = {
    getServerOptions: getServerOptions,
    getCompileOptions: getCompileOptions
};
