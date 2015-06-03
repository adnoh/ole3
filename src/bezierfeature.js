goog.provide('ole3.BezierWrapper');

goog.require('pomax.Bezier');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');

/**
 * [BezierWrapper description]
 * @param {ol.Feature} feature
 * @param {object.<string, *>} opt_properties
 * @constructor
 */
ole3.BezierWrapper = function(feature, opt_properties) {
    this.feature_ = feature;
    this.properties_ = opt_properties || {};
};

/**
 * [getHandles description]
 * @return {Array.<ol.Feature>}
 */
ole3.BezierWrapper.prototype.getHandles = function() {
    var geometry = this.feature_.getGeometry();
    goog.asserts.assert(geometry instanceof ol.geom.LineString,
            'BezierWrapper only supports LineStrings');
    var handles = [];
    this.bezierDesc_ = [];
    var coordinates = geometry.getCoordinates();
    for (var i = 0, ii = coordinates.length - 1; i < ii; i++) {
        var handleCoords = this.handlesForLine_(coordinates[i], coordinates[i + 1]);
        this.bezierDesc_.push([1, handleCoords]);

        for (j = 0, jj = (i < ii - 1) ? 3 : 4; j < jj; j++) {
            lastHandle = new ol.Feature({
                geometry: new ol.geom.Point(handleCoords[j])
            });
            lastHandle.on('change', function(i, j) { return function(evt) { this.handleHandleMove_(i, j, evt.target.getGeometry().getCoordinates()) }}(i, j), this);
            handles.push(lastHandle);
        }
    }
    return handles;
};

ole3.BezierWrapper.prototype.olCoord2bezierCoord_ = function(coordinate) {
    return {
        x: coordinate[0],
        y: coordinate[1]
    };
};

ole3.BezierWrapper.prototype.bezierCoord2olCoord_ = function(coordinate) {
    return [coordinate.x, coordinate.y];
};

ole3.BezierWrapper.prototype.handlesForLine_ = function(start, end) {
    diffThird = [(end[0] - start[0]) / 3, (end[1] - start[1]) / 3];
    return [
        start,
        [start[0] + diffThird[0], start[1] + diffThird[1]],
        [start[0] + 2 * diffThird[0], start[1] + 2 * diffThird[1]],
        end
    ];
};

ole3.BezierWrapper.prototype.handleHandleMove_ = function(index, handle, coord) {
    var INTERPOLATION_POINT_N = 100;
    if (handle == 0 && index > 0) {
        this.handleHandleMove_(index - 1, 3, coord);
    }
    var startCoord = 0;
    for (var i = 0; i < index; i++) {
        startCoord += this.bezierDesc_[i][0];
    }
    var affectedCoord = this.bezierDesc_[index][0];
    this.bezierDesc_[index][1][handle] = coord;
    var geometry = this.feature_.getGeometry();
    var oldCoordinates = geometry.getCoordinates();
    var bezier = new pomax.Bezier(goog.array.map(this.bezierDesc_[index][1], this.olCoord2bezierCoord_));
    this.bezierDesc_[index][0] = INTERPOLATION_POINT_N + 1;
    oldCoordinates.splice.apply(oldCoordinates, [startCoord, affectedCoord].concat(goog.array.map(bezier.getLUT(INTERPOLATION_POINT_N), this.bezierCoord2olCoord_)));
    geometry.setCoordinates(oldCoordinates);
}
