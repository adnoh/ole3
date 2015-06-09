goog.provide('ole3.Bezier');
goog.provide('ole3.bezier');
goog.provide('ole3.feature.Bezier');
goog.provide('ole3.feature.BezierString');

goog.require('goog.array');
goog.require('ol.extent');
goog.require('pomax.Bezier');

/**
 * An array of ol.Coordinates representing an bezier curve.
 * Example: `[[16, 48], [13, 25], [15, 16], [18, 25]]`.
 * @typedef {Array.<ol.Coordinate>} ole3.Bezier
 */
ole3.Bezier;


ole3.feature.bezierPoint = {
  CONTROL: 0,
  CURVE: 1
};

/**
 * BezierString wraps a feature with LineString geometry as bezier curve
 * @param {ol.Feature} feature Feature to be wrapped.
 * @constructor
 */
ole3.feature.BezierString = function(feature) {
  this.feature_ = feature;
  goog.asserts.assertInstanceof(this.feature_, ol.Feature,
      'feature must be an ol.Feature');
  this.beziers_ = new ol.Collection();
  this.beziers_.on('add', this.handleBezierAdd_, this);
  this.beziers_.on('remove', this.handleBezierRemove_, this);
  this.handles_ = new ol.Collection();

  this.ignoreUpdate_ = false;

  // TODO: if beziers already stored
  this.bezierifyLineString_();
};

ole3.feature.BezierString.prototype.splitBezier = function(bezier, t) {
  this.ignoreUpdate_ = true;
  var array = this.beziers_.getArray();
  for (var i = 0, ii = array.length; i < ii; i++) {
    if (array[i] === bezier) {
      break;
    }
  }
  this.beziers_.removeAt(i);
  var newBeziers = bezier.split(t);
  this.beziers_.insertAt(i, newBeziers[1]);
  this.beziers_.insertAt(i, newBeziers[0]);
  this.ignoreUpdate_ = false;
  this.update_();
}

ole3.feature.BezierString.prototype.combineBezier = function(bezier1, bezier2) {
  var array = this.beziers_.getArray();
  goog.asserts.assert(array.indexOf(bezier1) + 1 == array.indexOf(bezier2),
    'beziers must be adjacent to each other to be combined');
  this.ignoreUpdate_ = true;
  var cps1 = bezier1.controlPoints();
  var cps2 = bezier2.controlPoints();
  var newBezier = ole3.feature.Bezier(cps1[0], cps1[1], cps2[2], cps2[3]);
  var index = array.indexOf(bezier1);
  this.beziers_.removeAt(index);
  this.beziers_.removeAt(index);
  this.beziers_.insertAt(index, newBezier);
  this.ignoreUpdate_ = false;
  this.update_();
};

ole3.feature.BezierString.prototype.getBeziers = function() {
  return this.beziers_;
};

ole3.feature.BezierString.prototype.getHandles = function() {
  return this.handles_;
};

ole3.feature.BezierString.prototype.handleBezierCoordinatesChange_ = function(evt) {
  this.update_();
};

ole3.feature.BezierString.prototype.handleBezierAdd_ = function(evt) {
  var bezier = evt.element;
  goog.asserts.assertInstanceof(bezier, ole3.feature.Bezier,
      'can add only ole3.feature.Bezier');
  bezier.on('change:coordinates', this.handleBezierCoordinatesChange_, this);
  goog.array.map(bezier.getHandles(), this.handles_.push, this.handles_);
  this.update_();
};

ole3.feature.BezierString.prototype.handleBezierRemove_ = function(evt) {
  var bezier = evt.element;
  bezier.un('change:coordinates', this.handleBezierCoordinatesChange_, this);
  goog.array.map(bezier.getHandles(), this.handles_.remove, this.handles_);
  this.update_();
};

ole3.feature.BezierString.prototype.update_ = function() {
  if (this.ignoreUpdate_) {
    return;
  }
  var coordinates = [];
  var start = 0, drop = 0;
  this.beziers_.forEach(function(bezier) {
    var curCoord = bezier.get('coordinates');
    // goog.asserts.assert(start === 0 ||
    //     ol.coordinate.equals(coordinates[start], curCoord[0]),
    //     'end of previous bezier should be equal to curren bezier');
    coordinates.splice.apply(coordinates, [start, drop].
        concat(curCoord));
    start = coordinates.length - 1;
    drop = 1;
  });
  this.feature_.setGeometry(new ol.geom.LineString(coordinates));
  // TODO: Persist BezierCurve Information.
};

ole3.feature.BezierString.prototype.bezierifyLineString_ = function() {
  this.ignoreUpdate_ = true;
  var geometry = this.feature_.getGeometry();
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
      'only LineStrings are supported');
  var coordinates = geometry.getCoordinates();
  for (var i = 0, ii = coordinates.length - 1; i < ii; i++) {
    var segment = coordinates.slice(i, i + 2);
    var bezier = new ole3.feature.Bezier(
        this.controlPointsForSegment_.apply(
        this, segment), segment);
    var ind = this.beziers_.getLength() - 1;
    if (ind >= 0) {
      bezier.setPredecessor(this.beziers_.item(ind));
    }
    this.beziers_.push(bezier);
  }
  this.ignoreUpdate_ = false;
};

ole3.feature.BezierString.prototype.controlPointsForSegment_ =
    function(start, end) {
  var diff = ol.coordinate.sub(end.slice(), start);
  ol.coordinate.scale(diff, 1 / 3);
  return [
    start,
    ol.coordinate.add(start.slice(), diff),
    ol.coordinate.sub(end.slice(), diff),
    end
  ];
};


/**
 * Bezier wraps a segment of linestring described as bezier curve
 * @param {[type]}
 * @param {[type]}
 * @param {[type]}
 * @param {[type]}
 */
ole3.feature.Bezier = function(controlPoints, coordinates) {
  goog.base(this);
  this.set('coordinates', coordinates);
  this.controlPoints_ = controlPoints;
  this.predecessor_ = null;
  this.sucessor_ = null;

  this.createOrUpdateHandles_();
};
goog.inherits(ole3.feature.Bezier, ol.Object);

ole3.feature.Bezier.prototype.split = function(t) {
  var bezierJS = this.getBezierJS_();
  newCurves = bezierJS.split(t);
  var newBeziers = goog.array.map(newCurves, this.fromBezierJS_, this);
  newBezier[1].setPredecessor(newBezier[0]);
  return newBeziers;
};

ole3.feature.Bezier.prototype.controlPoints = function() {
  return this.controlPoints_.slice();
};

ole3.feature.Bezier.prototype.setPredecessor = function(bezier) {
  this.predecessor_ = bezier;
  bezier.setSucessor(this);
};

ole3.feature.Bezier.prototype.getPredecessor = function() {
  return this.predecessor_;
};

ole3.feature.Bezier.prototype.setSucessor = function(bezier) {
  this.sucessor_ = bezier;
};

ole3.feature.Bezier.prototype.getSucessor = function() {
  return this.sucessor_;
};

ole3.feature.Bezier.prototype.changeControlPoint = function(index, newValue) {
  if (this.handlingChange_) {
    return;
  }
  this.handlingChange_ = true;
  if (index == 0) {
    ol.coordinate.add(this.controlPoints_[1],
        ol.coordinate.sub(newValue.slice(), this.controlPoints_[0]));
  } else if (index == 3) {
    ol.coordinate.add(this.controlPoints_[2],
        ol.coordinate.sub(newValue.slice(), this.controlPoints_[3]));
  }
  this.controlPoints_[index] = newValue;
  this.createOrUpdateHandles_();
  this.set('coordinates', this.getLUT_());
  if (index == 0 && !goog.isNull(this.predecessor_)) {
    this.predecessor_.changeControlPoint(3, newValue);
  } else if (index == 3 && !goog.isNull(this.sucessor_)) {
    this.sucessor_.changeControlPoint(0, newValue);
  }
  this.handlingChange_ = false;
};

ole3.feature.Bezier.prototype.closestPoint = function(coordinate) {
  var closestCurvePoint = this.closestCurvePoint(coordinate);
  var closestHandlePoint = this.closestControlPoint(coordinate);
  var sqDistFn = ol.coordinate.squaredDistance;
  return (sqDistFn(coordinate, closestCurvePoint.coordinate) <
      sqDistFn(coordinate, closestHandlePoint.coordinate)) ?
      closestCurvePoint : closestHandlePoint;
};

ole3.feature.Bezier.prototype.closestCurvePoint = function(coordinate) {
  var PRECISION = 100;
  var lutPoints = this.getLUT_();
  var closestPoints = [];
  for (var i = 0; i < PRECISION; i++) {
    segment = lutPoints.slice(i, i + 2);
    closestOnSegment = ol.coordinate.closestOnSegment(coordinate, segment);
    closestPoints.push(closestOnSegment);
  }
  var closest = this.getClosestCoordinateIndex_(coordinate, closestPoints);
  var sqDistFn = ol.coordinate.squaredDistance;
  var segmentLength = sqDistFn.apply(null,
      lutPoints.slice(closest.ind, closest.ind + 2));
  var lengthToClosest = sqDistFn.apply(null,
      lutPoints[closest.ind], closestPoints[closest.ind]);
  var parOnSegment = lengthToClosest / segmentLength;
  var parameter = (closest.ind + parOnSegment) * 1 / PRECISION;
  return {
    type: ole3.feature.bezierPoint.CURVE,
    parameter: parameter,
    coordinate: closestPoints[closest.ind],
    squaredDistance: closest.sqDist
  };
};

ole3.feature.Bezier.prototype.closestControlPoint = function(coordinate) {
  var cps = this.controlPoints_;
  var closest = this.getClosestCoordinateIndex_(coordinate, cps);
  return {
    type: ole3.feature.bezierPoint.CONTROL,
    index: closest.ind,
    coordinate: cps[closest.ind],
    squaredDistance: closest.sqDist
  };
};

ole3.feature.Bezier.prototype.getHandles = function() {
  return this.handles_;
};

ole3.feature.Bezier.prototype.getExtent = function() {
  return ol.extent.boundingExtent(this.controlPoints_);
};

ole3.feature.Bezier.prototype.getClosestCoordinateIndex_ =
    function(needleCoord, haystackCoords) {
  var sqDistFn = ol.coordinate.squaredDistance;
  var closestIndex = -1, minSqDist = -1;
  for (i = haystackCoords.length - 1; i >= 0; --i) {
    var sqDist = sqDistFn(needleCoord, haystackCoords[i]);
    if (sqDist < minSqDist || closestIndex < 0) {
      closestIndex = i;
      minSqDist = sqDist;
    }
  }
  return {
    ind: closestIndex,
    sqDist: minSqDist
  };
}

ole3.feature.Bezier.prototype.getLUT_ = function() {
  var PRECISION = 100;
  var bezierJS = this.getBezierJS_();
  return goog.array.map(bezierJS.getLUT(PRECISION), this.fromBezierJSCoord_);
}

ole3.feature.Bezier.prototype.getBezierJS_ = function() {
  var coordObjs = goog.array.map(this.controlPoints_,
      this.toBezierJSCoord_);
  return new pomax.Bezier(coordObjs);
};

ole3.feature.Bezier.prototype.fromBezierJS_ = function(c) {
  return new this.prototype.constructor(
      goog.array.map(c.points, this.fromBezierJSCoord_));
};

ole3.feature.Bezier.prototype.toBezierJSCoord_ = function(coordinate) {
  return {x: coordinate[0], y: coordinate[1]};
};

ole3.feature.Bezier.prototype.fromBezierJSCoord_ = function(bezierJSCoord) {
  return [bezierJSCoord.x, bezierJSCoord.y];
};

ole3.feature.Bezier.prototype.createOrUpdateHandles_ = function() {
  var cps = this.controlPoints_;
  if (goog.isDef(this.handles_)) {
    this.handles_[0].setGeometry(new ol.geom.LineString(cps.slice(0, 2)))
    this.handles_[1].setGeometry(new ol.geom.LineString(cps.slice(2, 4)))
  } else {
    this.handles_ = [];
    this.handles_.push(this.newHandleFeature_(cps.slice(0, 2)));
    this.handles_.push(this.newHandleFeature_(cps.slice(2, 4)));
  }
};

ole3.feature.Bezier.prototype.newHandleFeature_ = function(start, end) {
  return new ol.Feature(new ol.geom.LineString(start, end));
};

/**
 * Get the closest coordinate to the given coordinate on the bezier curve.
 * @param  {ole3.Bezier} bezier Bezier curve on which the closest coordinate
 *                              should be
 * @param  {ol.Coordinate} coordinate Coordinate to which the closest point is
 *                                    requested
 * @return {ol.Coordinate} The closes coordinate on the bezier curve.
 */
// ole3.bezier.closestOnCurveToCoordinate = function(bezier, coordinate) {
  
// };

// ole3.bezier.closestHandleToCoordinate = function(bezier, coordinate) {
//   var closestPoints = [
//     ole3.bezier.closestOnCurveToCoordinate(bezier, coordinate),
//     bezier[1],
//     bezier[2]
//   ];
//   closestPoints.sort(ole3.bezier.compareByDistanceTo(coordinate));
//   return closestPoints[0];
// }

// ole3.bezier.getClosestHandle = function(bezier, coordinate) {
//   var closestOnCurve = closestOnCurveToCoordinate(bezier, coordinate);

// }



// ole3.bezier.fromBezierJS = function(bezierJS) {
//   return goog.array.map(bezierJS.points, ole3.bezier.bezierJSCoordAsCoord);
// };

// ole3.bezier.coordAsBezierJSCoord = function(coordinate) {
//   return {
//       x: coordinate[0],
//       y: coordinate[1]
//     };
// };

// ole3.bezier.bezierJSCoordAsCoord = function(bezierJSCoord) {
//   return [bezierJSCoord.x, bezierJSCoord.y];
// };

// ole3.bezier.compareByDistanceTo = function(coordinate) {
//   return function(a, b) {
//     return ol.coordinate.squaredDistance(a, coordinate) -
//         ol.coordinate.squaredDistance(b, coordinate);
//   };
// };

// ole3.bezier.squaredDistanceTo = function(coordinate) {
//   return function(a) {
//     return ol.coordinate.squaredDistance(a, coordinate);
//   }
// }

// ole3.bezier.indexOfSmallest = function(a) {
//  var lowest = 0;
//  for (var i = 1; i < a.length; i++) {
//   if (a[i] < a[lowest]) lowest = i;
//  }
//  return lowest;
// };

// ole3.bezier.handleDistanceToFn = function(coordinate) {
//   closestHandleFn = ole3.bezier.closestHandleToCoordinate;
//   return function(bezier) {
//     return closestHandleFn(bezier, coordinate);
//   }
// };
