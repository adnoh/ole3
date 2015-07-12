var p = require('path');

module.exports = {
    relInPackage: function(pkg, path) {
        var pFile = require.resolve(pkg);
        var pFolder = p.dirname(pFile);
        return p.join(pFolder, path);
    },
    resolvePath: function(path) {
        if (Array.isArray(path)) {
            path = this.relInPackage(path[0], path[1]);
            path = p.relative(p.resolve(p.join(__dirname, '../')), path)
        };
        return path;
    }
};
