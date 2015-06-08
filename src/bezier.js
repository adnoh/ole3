goog.provide('ole3.Bezier');
goog.provide('ole3.bezier');

goog.require('goog.array');
goog.require('pomax.Bezier');

/**
 * An array of ol.Coordinates representing an bezier curve.
 * Example: `[[16, 48], [13, 25], [15, 16], [18, 25]]`.
 * @typedef {Array.<ol.Coordinate>} ole3.Bezier
 */
ole3.Bezier;

ole3.bezier.PRECISION = 100;

ole3.bezier.handle = {
  CONTROL_POINT: 0,
  CURVE_PARAMETER: 1
};

/**
 * Get the closest coordinate to the given coordinate on the bezier curve.
 * @param  {ole3.Bezier} bezier Bezier curve on which the closest coordinate
 *                              should be
 * @param  {ol.Coordinate} coordinate Coordinate to which the closest point is
 *                                    requested
 * @return {ol.Coordinate} The closes coordinate on the bezier curve.
 */
ole3.bezier.closestOnCurveToCoordinate = function(bezier, coordinate) {
  var bezierJS = ole3.bezier.asBezierJS(bezier);
  var lut = goog.array.map(bezierJS.getLUT(ole3.bezier.PRECISION),
      ole3.bezier.bezierJSCoordAsCoord);
  var closestPoints = [];
  for (var i = 0, ii = ole3.bezier.PRECISION; i < ii; i++) {
    closestPoints.push(
      ol.coordinate.closestOnSegment(coordinate, lut.slice(i, i + 2))
    );
  }
  closestPoints.sort(ole3.bezier.compareByDistanceTo(coordinate));
  return closestPoints[0];
};

ole3.bezier.closestHandleToCoordinate = function(bezier, coordinate) {
  var closestPoints = [
    ole3.bezier.closestOnCurveToCoordinate(bezier, coordinate),
    bezier[1],
    bezier[2]
  ];
  closestPoints.sort(ole3.bezier.compareByDistanceTo(coordinate));
  return closestPoints[0];
}

ole3.bezier.getClosestHandle = function(bezier, coordinate) {
  var closestOnCurve = closestOnCurveToCoordinate(bezier, coordinate);

}

ole3.bezier.asBezierJS = function(bezier) {
  return new pomax.Bezier(goog.array.map(bezier,
      ole3.bezier.coordAsBezierJSCoord));
};

ole3.bezier.fromBezierJS = function(bezierJS) {
  return goog.array.map(bezierJS.points, ole3.bezier.bezierJSCoordAsCoord);
};

ole3.bezier.coordAsBezierJSCoord = function(coordinate) {
  return {
      x: coordinate[0],
      y: coordinate[1]
    };
};

ole3.bezier.bezierJSCoordAsCoord = function(bezierJSCoord) {
  return [bezierJSCoord.x, bezierJSCoord.y];
};

ole3.bezier.compareByDistanceTo = function(coordinate) {
  return function(a, b) {
    return ol.coordinate.squaredDistance(a, coordinate) -
        ol.coordinate.squaredDistance(b, coordinate);
  };
};

ole3.bezier.squaredDistanceTo = function(coordinate) {
  return function(a) {
    return ol.coordinate.squaredDistance(a, coordinate);
  }
}

ole3.bezier.indexOfSmallest = function(a) {
 var lowest = 0;
 for (var i = 1; i < a.length; i++) {
  if (a[i] < a[lowest]) lowest = i;
 }
 return lowest;
};

ole3.bezier.handleDistanceToFn = function(coordinate) {
  closestHandleFn = ole3.bezier.closestHandleToCoordinate;
  return function(bezier) {
    return closestHandleFn(bezier, coordinate);
  }
};
