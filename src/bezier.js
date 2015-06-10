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

ole3.feature.BezierString.prototype.reset = function(bezier, controlPoint) {
  if (controlPoint === 1 || controlPoint === 2) {
    var cps = bezier.controlPoints();
    var defaultControlPoints = this.controlPointsForSegment_(cps[0], cps[3]);
    bezier.changeControlPoint(controlPoint, defaultControlPoints[controlPoint]);
    return {
      changed: [bezier],
      removed: [],
      added: []
    };
  }
  if (this.beziers_.getLength() == 1) {
    return {
      changed: [],
      removed: [],
      added: []
    }
  }
  if (controlPoint === 0) {
    var predecessor = bezier.getPredecessor();
    var changed = this.combineBezier(predecessor, bezier);
    return {
      changed: [],
      removed: goog.isNull(predecessor) ? [bezier] : [bezier, predecessor],
      added: changed
    };
  }
  if (controlPoint === 3) {
    var sucessor = bezier.getSucessor();
    var changed = this.combineBezier(bezier, sucessor);
    return {
      changed: [],
      removed: goog.isNull(sucessor) ? [bezier] : [bezier, sucessor],
      added: changed
    };
  }
};

ole3.feature.BezierString.prototype.splitBezier = function(bezier, t) {
  this.ignoreUpdate_ = true;
  var array = this.beziers_.getArray();
  for (var i = 0, ii = array.length; i < ii; i++) {
    if (array[i] === bezier) {
      break;
    }
  }
  var newBeziers = bezier.split(t);
  this.beziers_.removeAt(i);
  this.beziers_.insertAt(i, newBeziers[1]);
  this.beziers_.insertAt(i, newBeziers[0]);
  var predecessor = bezier.getPredecessor();
  if (!goog.isNull(predecessor)) {
    newBeziers[0].setPredecessor(predecessor);
  }
  var sucessor = bezier.getSucessor();
  if (!goog.isNull(sucessor)) {
    sucessor.setPredecessor(newBeziers[1]);
  }
  this.ignoreUpdate_ = false;
  this.update_();
  return newBeziers;
};

ole3.feature.BezierString.prototype.combineBezier = function(bezier1, bezier2) {
  if (goog.isNull(bezier1)) {
    this.removeBezier(bezier2);
    return [];
  }
  if (goog.isNull(bezier2)) {
    this.removeBezier(bezier1);
    return [];
  }
  var array = this.beziers_.getArray();
  goog.asserts.assert(array.indexOf(bezier1) + 1 == array.indexOf(bezier2),
    'beziers must be adjacent to each other to be combined');
  this.ignoreUpdate_ = true;
  var cps1 = bezier1.controlPoints();
  var cps2 = bezier2.controlPoints();
  var newBezier = new ole3.feature.Bezier([cps1[0], cps1[1], cps2[2], cps2[3]]);
  var predecessor = bezier1.getPredecessor();
  if (!goog.isNull(predecessor)) {
    newBezier.setPredecessor(predecessor);
  }
  var sucessor = bezier2.getSucessor();
  if (!goog.isNull(sucessor)) {
    sucessor.setPredecessor(newBezier);
  }
  var index = array.indexOf(bezier1);
  this.beziers_.removeAt(index);
  this.beziers_.removeAt(index);
  this.beziers_.insertAt(index, newBezier);
  this.ignoreUpdate_ = false;
  this.update_();
  return [newBezier];
};

ole3.feature.BezierString.prototype.removeBezier = function(bezier) {
  var predecessor = bezier.getPredecessor();
  var sucessor = bezier.getSucessor();
  if (!goog.isNull(predecessor)) {
    predecessor.setSucessor(null);
  }
  if (!goog.isNull(sucessor)) {
    sucessor.setPredecessor(null);
  }
  var index = this.beziers_.getArray().indexOf(bezier);
  this.beziers_.removeAt(index);
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
  this.controlPoints_ = controlPoints;
  this.predecessor_ = null;
  this.sucessor_ = null;
  if (!goog.isDef(coordinates)) {
    coordinates = this.getLUT_();
  }
  this.set('coordinates', coordinates);
  this.createOrUpdateHandles_();
};
goog.inherits(ole3.feature.Bezier, ol.Object);

ole3.feature.Bezier.prototype.split = function(t) {
  var bezierJS = this.getBezierJS_();
  newCurves = bezierJS.split(t);
  var newBeziers = [this.fromBezierJS_(newCurves.left),
      this.fromBezierJS_(newCurves.right)];
  newBeziers[1].setPredecessor(newBeziers[0]);
  return newBeziers;
};

ole3.feature.Bezier.prototype.controlPoints = function() {
  return this.controlPoints_.slice();
};

ole3.feature.Bezier.prototype.setPredecessor = function(bezier) {
  this.predecessor_ = bezier;
  if (!goog.isNull(bezier)) {
    bezier.setSucessor(this);
  }
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
  var lutPoints = this.getLUT_();
  var precision = lutPoints.length - 1;
  var closestPoints = [];
  for (var i = 0; i < precision; i++) {
    segment = lutPoints.slice(i, i + 2);
    closestOnSegment = ol.coordinate.closestOnSegment(coordinate, segment);
    closestPoints.push(closestOnSegment);
  }
  var closest = this.getClosestCoordinateIndex_(coordinate, closestPoints);
  var sqDistFn = ol.coordinate.squaredDistance;
  var segmentLength = sqDistFn.apply(null,
      lutPoints.slice(closest.ind, closest.ind + 2));
  var lengthToClosest = sqDistFn(lutPoints[closest.ind],
      closestPoints[closest.ind]);
  var parOnSegment = lengthToClosest / segmentLength;
  var parameter = (closest.ind + parOnSegment) * 1 / precision;
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
};

ole3.feature.Bezier.prototype.isLine_ = function() {
  var cps = this.controlPoints_;
  var v1 = ol.coordinate.sub(cps[1].slice(), cps[0]);
  var v2 = ol.coordinate.sub(cps[2].slice(), cps[0]);
  var v3 = ol.coordinate.sub(cps[3].slice(), cps[0]);
  return this.areParalell_(v3, v1) && this.areParalell_(v3, v2);
};

ole3.feature.Bezier.prototype.areParalell_ = function(v1, v2) {
  var TOLERANCE = 0.01;
  return Math.abs(v1[1] * v2[0] + (-v1[0]) * v2[1]) < TOLERANCE;
};

ole3.feature.Bezier.prototype.getLUT_ = function() {
  if (this.isLine_()) {
    var cps = this.controlPoints_;
    return [cps[0], cps[3]];
  }
  var PRECISION = 100;
  var bezierJS = this.getBezierJS_();
  return goog.array.map(bezierJS.getLUT(PRECISION), this.fromBezierJSCoord_);
};

ole3.feature.Bezier.prototype.getBezierJS_ = function() {
  var coordObjs = goog.array.map(this.controlPoints_,
      this.toBezierJSCoord_);
  return new pomax.Bezier(coordObjs);
};

ole3.feature.Bezier.prototype.fromBezierJS_ = function(c) {
  var controlPoints = goog.array.map(c.points, this.fromBezierJSCoord_);
  return new this.constructor(controlPoints);
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
    this.handles_[0].setGeometry(new ol.geom.LineString(cps.slice(0, 2)));
    this.handles_[1].setGeometry(new ol.geom.LineString(cps.slice(2, 4)));
  } else {
    this.handles_ = [];
    this.handles_.push(this.newHandleFeature_(cps.slice(0, 2)));
    this.handles_.push(this.newHandleFeature_(cps.slice(2, 4)));
  }
};

ole3.feature.Bezier.prototype.newHandleFeature_ = function(start, end) {
  return new ol.Feature(new ol.geom.LineString(start, end));
};
