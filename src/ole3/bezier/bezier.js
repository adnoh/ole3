goog.provide('ole3.bezier.Control');
goog.provide('ole3.bezier.ControlPoint');
goog.provide('ole3.bezier.ControlPointDescriptor');
goog.provide('ole3.bezier.ControlPointI');
goog.provide('ole3.bezier.ControlPointProviderI');
goog.provide('ole3.bezier.ControlPointType');
goog.provide('ole3.bezier.Curve');
goog.provide('ole3.bezier.CurvePoint');
goog.provide('ole3.feature.ExtentsI');
goog.provide('ole3.wrapper.BezierString');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');
// goog.require('ol.Collection');
// goog.require('ol.Feature');
// goog.require('ol.Object');
goog.require('ole3.lib.olinternals.coordinate');
// goog.require('ol.extent');
// goog.require('ol.geom.LineString');
goog.require('ole3.structs.RBush');
goog.require('pomax');


/**
 * Contents:
 *   - Constants
 *   - Interfaces
 *   - Structs
 *   - Types
 */

/**
 * Constants:
 */

/**
 * Control Point Types
 * @const
 * @enum {number}
 */
ole3.bezier.ControlPointType = {
  MAIN: 0,
  LEFT: 2,
  RIGHT: 1
};

/**
 * Interfaces:
 */

/**
 * A movable point handle.
 * @interface
 */
ole3.bezier.ControlPointI = function() {};
/**
 * Move this handle to new coordinate.
 * @param {ol.Coordinate} coordinate Coordinate to move to.
 * @return {ole3.bezier.ControlPointI}
 *         A new handle point replacing this one. Can be different.
 */
ole3.bezier.ControlPointI.prototype.moveTo = function(coordinate) {};
/**
 * Remove or reset this control point.
 * @return {? ole3.bezier.ControlPointI} [description]
 */
ole3.bezier.ControlPointI.prototype.remove = function() {};
/**
 * Get the Coordinate
 * @return {ol.Coordinate} Coordinate.
 */
ole3.bezier.ControlPointI.prototype.getCoordinate = function() {};
/**
 * Get the underlying BezierString
 * @return {ole3.wrapper.BezierString} BezierString
 */
ole3.bezier.ControlPointI.prototype.getBezierString = function() {};

/**
 * Feature that can be queryied for a closest handle.
 * @interface
 * @extends {ole3.feature.ExtentsI}
 */
ole3.bezier.ControlPointProviderI = function() {};
/**
 * Query the closest HandlePoint to coordinate
 * @param  {ol.Coordinate} coordinate Coordinate
 * @return {ole3.bezier.ControlPointDescriptor} Closest Handle.
 */
ole3.bezier.ControlPointProviderI.prototype.getClosestHandlePoint =
    function(coordinate) {};

/**
 * Has an Extent
 * @interface
 */
ole3.feature.ExtentsI = function() {};
/**
 * Get Extent
 * @return {ol.Extent} Extent
 */
ole3.feature.ExtentsI.prototype.getExtent = function() {};

/**
 * Structs:
 */

/**
 * Descriptor the closest HandlePoint.
 * @param {ole3.bezier.ControlPointI} handlePoint Closest HandlePointI.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} sqDistance Squared Distance in currecnt coordinate system.
 * @param {boolean} snapable Wether this should be snapped to.
 * @constructor
 * @struct
 */
ole3.bezier.ControlPointDescriptor =
    function(handlePoint, coordinate, sqDistance, snapable) {
  /**
   * Closest HandlePointI.
   * @type {ole3.bezier.ControlPointI}
   */
  this.handlePoint = handlePoint;
  /**
   * Coordinate.
   * @type {ol.Coordinate}
   */
  this.coordinate = coordinate;
  /**
   * Squared Distance in currecnt coordinate system.
   * @type {number}
   */
  this.sqDistance = sqDistance;
  /**
   * Wether this should be snapped to.
   * @type {boolean}
   */
  this.snapable = snapable;
};

/**
 * Types
 */

/**
 * Feature to be displayed between two bezier curves as handle for manipulation.
 * @param {ole3.wrapper.BezierString} bezierS
 *        BezierString this handle belongs to.
 * @param {?ole3.bezier.Curve} left
 *        Left hand bezier curve or null if first handle.
 * @param {?ole3.bezier.Curve} right
 *        Right hand bezier curve or null if last handle.
 * @constructor
 * @implements {ole3.bezier.ControlPointProviderI}
 * @implements {ole3.feature.ExtentsI}
 */
ole3.bezier.Control = function(bezierS, left, right) {
  goog.asserts.assert(!(goog.isNull(left) && goog.isNull(right)),
    'At least one side needs to be a bezier curve.');

  /**
   * Left hand bezier curve or null if first handle.
   * @type {?ole3.bezier.Curve}
   * @private
   */
  this.left_ = left;

  /**
   * Right hand bezier curve or null if last handle.
   * @type {?ole3.bezier.Curve}
   * @private
   */
  this.right_ = right;

  /**
   * BezierString handle belongs to.
   * @type {ole3.wrapper.BezierString}.
   * @private
   */
  this.bezierS_ = bezierS;
};

/**
 * Get the BezierString
 * @return {ole3.wrapper.BezierString} The BezierString.
 */
ole3.bezier.Control.prototype.getBezierString = function() {
  return this.bezierS_;
};

/**
 * Update ControlPoint with new coordinate.
 * @param {ole3.bezier.ControlPointType} point Point to be updated.
 * @param {ol.Coordinate} coordinate New Coordinate.
 */
ole3.bezier.Control.prototype.updateControlPoint =
    function(point, coordinate) {
  var left = this.left_;
  var right = this.right_;
  var types = ole3.bezier.ControlPointType;
  switch (point) {
    case types.MAIN:
      if (left) {
        left.changeControlPoint(3, coordinate);
      }
      // fallthrough
    case types.RIGHT:
      if (right) {
        right.changeControlPoint(point, coordinate);
      }
      break;
    case types.LEFT:
      if (left) {
        left.changeControlPoint(point, coordinate);
      }
      break;
  }
  this.bezierS_.changeHandle(this);
};

/**
 * Resets the ControlPoints to straight lines if left or right control point
 * or removes the whole handle if the main control point is reset.
 * @param {ole3.bezier.ControlPointType} point Point to be reset.
 * @return {boolean} If reset was successful.
 */
ole3.bezier.Control.prototype.resetControlPoint =
    function(point) {
  var left = this.left_;
  var right = this.right_;
  var bezier;
  switch (point) {
    case ole3.bezier.ControlPointType.MAIN:
      return this.remove();
    case ole3.bezier.ControlPointType.LEFT:
      bezier = left;
      break;
    case ole3.bezier.ControlPointType.RIGHT:
      bezier = right;
      break;
  }
  if (!bezier) { return false; }
  bezier.resetControlPoint(point);
  this.bezierS_.changeHandle(this);
  return true;
};

/**
 * Create a new HandlePoint for the main ControlPoint.
 * @return {ole3.bezier.ControlPointI}
 *         New HandlePoint for the main ControlPoint.
 */
ole3.bezier.Control.prototype.mainHandlePoint = function() {
  var cps = this.getControlPoints();
  var type = ole3.bezier.ControlPointType.MAIN;
  return new ole3.bezier.ControlPoint(this, type, cps[type]);
};

/**
 * Get the handle geometries from the underlying Beziers.
 * @return {Array<ol.geom.LineString>} Handle geometries.
 */
ole3.bezier.Control.prototype.getHandles = function() {
  var handles = [];
  var left = this.left_;
  var right = this.right_;
  if (left) {
    handles.push(left.rigthHandle());
  }
  if (right) {
    handles.push(right.leftHandle());
  }
  return handles;
};

/**
 * @inheritDoc
 */
ole3.bezier.Control.prototype.getClosestHandlePoint =
    function(coordinate) {
  var cps = this.getControlPoints();
  var reduce = goog.array.reduce;
  var keys = goog.array.map(goog.object.getKeys(cps),
      function(k) {
    return /** @type {ole3.bezier.ControlPointType} */ (parseInt(k, 10));
  });
  var descr = ole3.bezier.ControlPointDescriptor;
  var closestHandlePoint = goog.array.reduce(keys,
      function(last, curr) {
    var sqDist = ole3.lib.olinternals.coordinate.squaredDistance(cps[curr], coordinate);
    if (goog.isDef(last) && sqDist >= last.sqDistance) { return last; }
    var handlePoint =
        new ole3.bezier.ControlPoint(this, curr, cps[curr]);
    return new descr(handlePoint, cps[curr], sqDist, true);
  }, undefined, this);
  return closestHandlePoint;
};

/**
 * @inheritDoc
 */
ole3.bezier.Control.prototype.getExtent = function() {
  var cps = this.getControlPoints();
  return ol.extent.boundingExtent(goog.object.getValues(cps));
};

/**
 * Gets all control points of this handle
 * @return {Object<ole3.bezier.ControlPointType, ol.Coordinate>}
 *         Control Points.
 */
ole3.bezier.Control.prototype.getControlPoints = function() {
  var left = this.left_;
  var right = this.right_;
  var cps = {};
  if (left) {
    var leftCps = left.getControlPoints();
    cps[ole3.bezier.ControlPointType.LEFT] = leftCps[2];
    cps[ole3.bezier.ControlPointType.MAIN] = leftCps[3];
  }
  if (right) {
    var rightCps = right.getControlPoints();
    cps[ole3.bezier.ControlPointType.RIGHT] = rightCps[1];
    if (!goog.object.containsKey(cps, ole3.bezier.ControlPointType.MAIN)) {
      cps[ole3.bezier.ControlPointType.MAIN] = rightCps[0];
    } else {
      goog.asserts.assert(ole3.lib.olinternals.coordinate.equals(rightCps[0],
        cps[ole3.bezier.ControlPointType.MAIN]),
        'Adjacent bezier curves should be connected.');
    }
  }
  return cps;
};

/**
 * Get Bezier Curves affected by this handle.
 * @return {Array<ole3.bezier.Curve>} Bezier Curves
 */
ole3.bezier.Control.prototype.getBeziers = function() {
  var left = this.left_;
  var right = this.right_;
  var bez = [];
  if (left) { bez.push(left); }
  if (right) { bez.push(right); }
  return bez;
};

/**
 * Remove this handle if in the middle.
 * @return {boolean} Deletion was successful.
 */
ole3.bezier.Control.prototype.remove = function() {
  return this.bezierS_.removeHandle(this);
};

/**
 * Set a new left curve for this handle.
 * @param {ole3.bezier.Curve} left New left Curve
 */
ole3.bezier.Control.prototype.setLeft = function(left) {
  this.left_ = left;
};

/**
 * HandlePoint for a control point.
 * @implements {ole3.bezier.ControlPointI}
 * @param {ole3.bezier.Control} bezierH Affected BezierHandle
 * @param {ole3.bezier.ControlPointType} point
 *        Affected controlPoint.
 * @param {ol.Coordinate} coordinate Coordinate
 * @constructor
 */
ole3.bezier.ControlPoint = function(bezierH, point, coordinate) {
  /**
   * Affected ControlPoint.
   * @type {ole3.bezier.ControlPointType}
   * @private
   */
  this.point_ = point;

  /**
   * Affected BezierHandle
   * @type {ole3.bezier.Control}
   * @private
   */
  this.bezierHandle_ = bezierH;

  /**
   * Coordinate
   * @type {ol.Coordinate}
   * @private
   */
  this.coordinate_ = coordinate;
};

/**
 * @inheritDoc
 */
ole3.bezier.ControlPoint.prototype.moveTo = function(coordinate) {
  this.bezierHandle_.updateControlPoint(this.point_, coordinate);
  this.coordinate_ = coordinate;
  return this;
};

/**
 * @inheritDoc
 */
ole3.bezier.ControlPoint.prototype.remove = function() {
  return this.bezierHandle_.resetControlPoint(this.point_) ? null : this;
};

/**
 * @inheritDoc
 */
ole3.bezier.ControlPoint.prototype.getCoordinate = function() {
  return this.coordinate_.slice();
};

/**
 * @inheritDoc
 */
ole3.bezier.ControlPoint.prototype.getBezierString = function() {
  return this.bezierHandle_.getBezierString();
};

/**
 * Curve wraps a segment of linestring described as bezier curve
 * @param {Array<ol.Coordinate>} controlPoints
 *        The four coordinates describing the curve.
 * @param {ole3.wrapper.BezierString} bezierString
 *        Bezierstring this curve belongs to.
 * @implements {ole3.bezier.ControlPointProviderI}
 * @implements {ole3.feature.ExtentsI}
 * @extends {ol.Object}
 * @constructor
 */
ole3.bezier.Curve = function(controlPoints, bezierString) {
  goog.base(this);
  this.controlPoints_ = controlPoints;
  this.handles_ = [];
  this.handles_.push(this.newHandleFeature_(this.controlPoints_.slice(0, 2)));
  this.handles_.push(this.newHandleFeature_(this.controlPoints_.slice(2, 4)));
  this.bezierS_ = bezierString;
};
goog.inherits(ole3.bezier.Curve, ol.Object);

/**
 * Get the BezierString
 * @return {ole3.wrapper.BezierString} The BezierString.
 */
ole3.bezier.Curve.prototype.getBezierString = function() {
  return this.bezierS_;
};

/**
 * @inheritDoc
 */
ole3.bezier.Curve.prototype.getExtent = function() {
  var bezierJS = this.getBezierJS_();
  var bbox = bezierJS.bbox();
  return [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
};

/**
 * Splits the current Bezier at the given point t (between 0 and 1)
 * @param  {number} t Parameter at which the curve should be split.
 * @return {ole3.bezier.Control}
 *         Newly created Handle at specified point.
 */
ole3.bezier.Curve.prototype.splitAt = function(t) {
  var bezierJS = this.getBezierJS_();
  var newCurves = bezierJS.split(t);
  var newRightBezier = this.fromBezierJS_(newCurves['right']);
  this.setFromBezierJS_(newCurves['left']);
  var newHandle =
      new ole3.bezier.Control(this.bezierS_, this, newRightBezier);
  this.bezierS_.insertHandle(newHandle);
  return newHandle;
};

/**
 * Uses the right end of b as new right ControlPoints. This is intended to be
 * used before removing b.
 * @param  {ole3.bezier.Curve} b Bezier that right end should be used.
 */
ole3.bezier.Curve.prototype.combineWith = function(b) {
  var cps = this.controlPoints_;
  var newRightSide = b.controlPoints_.slice(2);
  cps.splice.apply(cps, [2, 2].concat(newRightSide));
  this.createOrUpdateHandles_();
};

/**
 * Reset the given ControlPoint to a straight line.
 * @param  {number} i Index of the ControlPoint
 */
ole3.bezier.Curve.prototype.resetControlPoint = function(i) {
  if (i != 1 && i != 2) { return; }
  var cps = this.controlPoints_;
  var vecMath = ole3.lib.olinternals.coordinate;
  var start = cps[0];
  var end = cps[3];
  var diff = vecMath.sub(end.slice(), start);
  var offset = vecMath.scale(diff, i / 3);
  this.controlPoints_[i] = ol.coordinate.add(start.slice(), offset);
  this.createOrUpdateHandles_();
};

ole3.bezier.Curve.prototype.getGeometry = function() {
  return this.getLUT_();
};

ole3.bezier.Curve.prototype.changeControlPoint = function(index, newValue) {
  if (index == 0) {
    ol.coordinate.add(this.controlPoints_[1],
        ole3.lib.olinternals.coordinate.sub(newValue.slice(), this.controlPoints_[0]));
  } else if (index == 3) {
    ol.coordinate.add(this.controlPoints_[2],
        ole3.lib.olinternals.coordinate.sub(newValue.slice(), this.controlPoints_[3]));
  }
  this.controlPoints_[index] = newValue;
  this.createOrUpdateHandles_();
};

ole3.bezier.Curve.prototype.closestCurvePoint = function(coordinate) {
  var lutPoints = this.getLUT_();
  var precision = lutPoints.length - 1;
  var closestPoints = [];
  for (var i = 0; i < precision; i++) {
    var segment = lutPoints.slice(i, i + 2);
    var closestOnSegment = ole3.lib.olinternals.coordinate.closestOnSegment(coordinate, segment);
    closestPoints.push(closestOnSegment);
  }
  var closest = this.getClosestCoordinateIndex_(coordinate, closestPoints);
  var sqDistFn = ole3.lib.olinternals.coordinate.squaredDistance;
  var segmentLength = sqDistFn.apply(null,
      lutPoints.slice(closest.ind, closest.ind + 2));
  var lengthToClosest = sqDistFn(lutPoints[closest.ind],
      closestPoints[closest.ind]);
  var parOnSegment = lengthToClosest / segmentLength;
  var parameter = (closest.ind + parOnSegment) * 1 / precision;
  return {
    parameter: parameter,
    coordinate: closestPoints[closest.ind],
    squaredDistance: closest.sqDist
  };
};

ole3.bezier.Curve.prototype.getClosestCoordinateIndex_ =
    function(needleCoord, haystackCoords) {
  var sqDistFn = ole3.lib.olinternals.coordinate.squaredDistance;
  var closestIndex = -1, minSqDist = -1;
  for (var i = haystackCoords.length - 1; i >= 0; --i) {
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

/**
 * @inheritDoc
 */
ole3.bezier.Curve.prototype.getClosestHandlePoint = function(coordinate) {
  var cp = this.closestCurvePoint(coordinate);
  var descr = ole3.bezier.ControlPointDescriptor;
  var ch = new ole3.bezier.CurvePoint(this, cp.parameter, cp.coordinate);
  return new descr(ch, cp.coordinate, cp.squaredDistance, false);
};

/**
 * Get the Linestring for the right handle of this Bezier curve.
 * @return {ol.geom.LineString} Right handle geometry.
 */
ole3.bezier.Curve.prototype.leftHandle = function() {
  return this.handles_[0];
};

/**
 * Get the Linestring for the right handle of this Bezier curve.
 * @return {ol.geom.LineString} Right handle geometry.
 */
ole3.bezier.Curve.prototype.rigthHandle = function() {
  return this.handles_[1];
};

/**
 * Get the Control Points of this bezier curve.
 * @return {Array<ol.Coordinate>} Copy of Control Points.
 */
ole3.bezier.Curve.prototype.getControlPoints = function() {
  return this.controlPoints_.slice();
};

ole3.bezier.Curve.prototype.isLine_ = function() {
  var cps = this.controlPoints_;
  var v1 = ole3.lib.olinternals.coordinate.sub(cps[1].slice(), cps[0]);
  var v2 = ole3.lib.olinternals.coordinate.sub(cps[2].slice(), cps[0]);
  var v3 = ole3.lib.olinternals.coordinate.sub(cps[3].slice(), cps[0]);
  return this.areParalell_(v3, v1) && this.areParalell_(v3, v2);
};

ole3.bezier.Curve.prototype.areParalell_ = function(v1, v2) {
  var TOLERANCE = 0.01;
  return Math.abs(v1[1] * v2[0] + (-v1[0]) * v2[1]) < TOLERANCE;
};

ole3.bezier.Curve.prototype.getLUT_ = function() {
  if (this.isLine_()) {
    var cps = this.controlPoints_;
    return [cps[0], cps[3]];
  }
  var PRECISION = 100;
  var bezierJS = this.getBezierJS_();
  return goog.array.map(bezierJS.getLUT(PRECISION), this.fromBezierJSCoord_);
};

ole3.bezier.Curve.prototype.getBezierJS_ = function() {
  var coordObjs = goog.array.map(this.controlPoints_,
      this.toBezierJSCoord_);
  return new pomax.Bezier(coordObjs);
};

ole3.bezier.Curve.prototype.fromBezierJS_ = function(c) {
  var controlPoints = goog.array.map(c['points'], this.fromBezierJSCoord_);
  return new this.constructor(controlPoints, this.bezierS_);
};

/**
 * Updates this Curve based on the ControlPoints of c
 * @param {?} c The BezierJS curve that controlpoints should be used.
 * @private
 */
ole3.bezier.Curve.prototype.setFromBezierJS_ = function(c) {
  this.controlPoints_ = goog.array.map(c['points'], this.fromBezierJSCoord_);
  this.createOrUpdateHandles_();
};

ole3.bezier.Curve.prototype.toBezierJSCoord_ = function(coordinate) {
  return {'x': coordinate[0], 'y': coordinate[1]};
};

ole3.bezier.Curve.prototype.fromBezierJSCoord_ = function(bezierJSCoord) {
  return [bezierJSCoord['x'], bezierJSCoord['y']];
};

ole3.bezier.Curve.prototype.createOrUpdateHandles_ = function() {
  var cps = this.controlPoints_;
  if (goog.isDef(this.handles_)) {
    this.handles_[0].setGeometry(new ol.geom.LineString(cps.slice(0, 2)));
    this.handles_[1].setGeometry(new ol.geom.LineString(cps.slice(2, 4)));
  }
};

/**
 * [newHandleFeature_ description]
 * @param  {Array<ol.Coordinate>} coordinates [description]
 * @return {ol.Feature}       [description]
 * @private
 */
ole3.bezier.Curve.prototype.newHandleFeature_ = function(coordinates) {
  return new ol.Feature(new ol.geom.LineString(coordinates));
};


/**
 * HandlePoint for a Point on the curve. Splits it on move.
 * @param {ole3.bezier.Curve} bezier Bezier to be split on move.
 * @param {number} parameter Point on curve, number between 0 and 1.
 * @param {ol.Coordinate} coordinate Coordinate
 * @constructor
 * @implements {ole3.bezier.ControlPointI}
 */
ole3.bezier.CurvePoint = function(bezier, parameter, coordinate) {
  /**
   * Bezier to be split on move.
   * @type {ole3.bezier.Curve}
   * @private
   */
  this.bezier_ = bezier;

  /**
   * Point on curve, number between 0 and 1.
   * @type {number}
   * @private
   */
  this.parameter_ = parameter;

  /**
   * Coordinate
   * @type {ol.Coordinate}
   * @private
   */
  this.coordinate_ = coordinate;
};

/**
 * @inheritDoc
 */
ole3.bezier.CurvePoint.prototype.moveTo = function(coordinate) {
  var bezier = this.bezier_;
  var par = this.parameter_;
  var newHandle = bezier.splitAt(par);
  var newHandlePoint = newHandle.mainHandlePoint();
  return newHandlePoint.moveTo(coordinate);
};

/**
 * @inheritDoc
 */
ole3.bezier.CurvePoint.prototype.remove = function() {
  return this;
};

/**
 * @inheritDoc
 */
ole3.bezier.CurvePoint.prototype.getCoordinate = function() {
  return this.coordinate_.slice();
};

/**
 * @inheritDoc
 */
ole3.bezier.CurvePoint.prototype.getBezierString = function() {
  return this.bezier_.getBezierString();
};




/**
 * BezierString wraps a feature with LineString geometry as bezier curve
 * @param {ol.Feature} feature Feature to be wrapped.
 * @constructor
 */
ole3.wrapper.BezierString = function(feature) {
  this.feature_ = feature;
  goog.asserts.assertInstanceof(this.feature_, ol.Feature,
      'feature must be an ol.Feature');

  this.handleFeatures_ = new ol.Collection();
  this.beziers_ = [];
  this.handles_ = [];

  /**
   * All Handles of this BezierString
   * @type {ole3.structs.RBush<ole3.bezier.ControlPointProviderI>}
   * @private
   */
  this.rBush_ = new ole3.structs.RBush();

  var bezierDesc = this.feature_.get('bezier');
  if (!bezierDesc) {
    bezierDesc = this.bezierifyLineString_();
  }
  this.loadFromControlPoints_(bezierDesc);
};

/**
 * Get the wrapped feature.
 * @return {ol.Feature} The underlying feature
 */
ole3.wrapper.BezierString.prototype.getFeature = function() {
  return this.feature_;
};

/**
 * [changeHandle description]
 * @param  {ole3.bezier.Control} handle [description]
 */
ole3.wrapper.BezierString.prototype.changeHandle = function(handle) {
  var reindex = handle.getBeziers();
  reindex.push(handle);
  goog.array.map(reindex, this.reIndexSpatial_, this);
  this.updateGeometry_();
};

/**
 * [removeHandle description]
 * @param  {ole3.bezier.Control} handle [description]
 */
ole3.wrapper.BezierString.prototype.removeHandle = function(handle) {
  var handleI = goog.array.findIndex(this.handles_,
      goog.functions.equalTo(handle));
  if (handleI == 0 || handleI == this.handles_.length - 1) { return false; }
  this.removePartAtIndex_(handleI);
  this.updateGeometry_();
};

/**
 * [insertHandle description]
 * @param  {ole3.bezier.Control} handle [description]
 */
ole3.wrapper.BezierString.prototype.insertHandle = function(handle) {
  var beziers = handle.getBeziers();
  var left = beziers[0];
  var right = beziers[1];
  var leftI = goog.array.findIndex(this.beziers_, goog.functions.equalTo(left));
  this.handles_[leftI + 1].setLeft(right);
  this.reIndexSpatial_(left);
  this.addPartAtIndex_(leftI + 1, right, handle);
  this.updateGeometry_();
};

/**
 * [removePartAtIndex_ description]
 * @param  {number} ind Index of the part to be removed.
 * @private
 */
ole3.wrapper.BezierString.prototype.removePartAtIndex_ = function(ind) {
  var handles = this.handles_;
  var handle = handles.splice(ind, 1)[0];
  var beziers = handle.getBeziers();
  var left = beziers[0];
  var right = beziers[1];
  var nextHandle = handles[ind];
  var removeFeat = handle.getHandles();
  removeFeat.push.apply(removeFeat, nextHandle.getHandles());
  goog.array.map(removeFeat, this.handleFeatures_.remove, this.handleFeatures_);
  var remove = [];
  remove.push(handle);
  remove.push.apply(remove, this.beziers_.splice(ind, 1));
  goog.array.map(remove, this.removeIndexSpatial_, this);
  left.combineWith(right);
  nextHandle.setLeft(left);
  var addFeat = nextHandle.getHandles();
  goog.array.map(addFeat, this.handleFeatures_.push, this.handleFeatures_);
  this.reIndexSpatial_(left);
};

/**
 * [addPartAtIndex_ description]
 * @param {number} ind    [description]
 * @param {ole3.bezier.Curve} bezier [description]
 * @param {ole3.bezier.Control} handle [description]
 * @private
 */
ole3.wrapper.BezierString.prototype.addPartAtIndex_ =
    function(ind, bezier, handle) {
  var features = handle.getHandles();
  features.push.apply(features, this.handles_[ind].getHandles());
  goog.array.map(features, this.handleFeatures_.remove, this.handleFeatures_);
  goog.array.map(features, this.handleFeatures_.push, this.handleFeatures_);
  this.beziers_.splice(ind, 0, bezier);
  this.handles_.splice(ind, 0, handle);
  var add = [bezier, handle];
  goog.array.map(add, this.addIndexSpatial_, this);
};

/**
 * [pushPart_ description]
 * @param {ole3.bezier.Curve} bezier Bezier
 * @param {ole3.bezier.Control} handle handle to be added.
 * @private
 */
ole3.wrapper.BezierString.prototype.pushPart_ =
    function(bezier, handle) {
  var features = handle.getHandles();
  goog.array.map(features, this.handleFeatures_.push, this.handleFeatures_);
  this.handles_.push(handle);
  var add = [handle];
  if (bezier) {
    this.beziers_.push(bezier);
    add.push(bezier);
  }
  goog.array.map(add, this.addIndexSpatial_, this);
};

/**
 * [reIndexSpatial_ description]
 * @param  {ole3.bezier.ControlPointProviderI} cpp [description]
 * @private
 */
ole3.wrapper.BezierString.prototype.reIndexSpatial_ = function(cpp) {
  this.rBush_.update(cpp.getExtent(), cpp);
};

/**
 * [reIndexSpatial_ description]
 * @param  {ole3.bezier.ControlPointProviderI} cpp [description]
 * @private
 */
ole3.wrapper.BezierString.prototype.removeIndexSpatial_ = function(cpp) {
  this.rBush_.remove(cpp);
};

/**
 * [reIndexSpatial_ description]
 * @param  {ole3.bezier.ControlPointProviderI} cpp [description]
 * @private
 */
ole3.wrapper.BezierString.prototype.addIndexSpatial_ = function(cpp) {
  this.rBush_.insert(cpp.getExtent(), cpp);
};

/**
 * Gets the current extent including all handles.
 * @return {ol.Extent} Extent
 */
ole3.wrapper.BezierString.prototype.getExtent = function() {
  return this.rBush_.getExtent();
};

/**
 * Get the closest handlePoint with optional box.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(ol.Coordinate):boolean} snapFn
 *        Function that indicates if a coordinate is close enough to snap to.
 * @param {?ol.Extent} box optional max distance.
 * @return {?ole3.bezier.ControlPointDescriptor} Descriptor.
 */
ole3.wrapper.BezierString.prototype.getClosestHandle =
    function(coordinate, snapFn, box) {
  var rb = this.rBush_;
  var handleGetters = !goog.isDef(box) ? rb.getAll() :
      rb.getInExtent(box);
  var cp = goog.array.reduce(handleGetters, function(prev, curr) {
      var cp = curr.getClosestHandlePoint(coordinate);
      if (goog.isNull(prev)) { return cp; }
      if (cp.snapable != prev.snapable) {
        var snap = cp.snapable ? cp : prev;
        if (snapFn(snap.coordinate)) { return snap; }
      }
      return cp.sqDistance < prev.sqDistance ? cp : prev;
    }, null);
  return cp && snapFn(cp.coordinate) ? cp : undefined;
};

ole3.wrapper.BezierString.prototype.getHandleFeatures = function() {
  return this.handleFeatures_;
};

/**
 * [updateGeometry_ description]
 * @private
 */
ole3.wrapper.BezierString.prototype.updateGeometry_ = function() {
  var beziers = this.beziers_;
  var coord = [];
  for (var i = 0, ii = beziers.length; i < ii; i++) {
    var drop = i == 0 ? 0 : 1;
    var bezier = beziers[i];
    coord.push.apply(coord, bezier.getGeometry().slice(drop));
  }
  var geom = /** @type {ol.geom.LineString} */ (this.feature_.getGeometry());
  geom.setCoordinates(coord);
  this.feature_.set('bezier',
      goog.array.map(beziers, function(b) { return b.getControlPoints(); }));
};

ole3.wrapper.BezierString.prototype.bezierifyLineString_ = function() {
  var geometry = this.feature_.getGeometry();
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
      'only LineStrings are supported');
  var coordinates = geometry.getCoordinates();
  var cps = [];
  for (var i = 0, ii = coordinates.length - 1; i < ii; i++) {
    var segment = coordinates.slice(i, i + 2);
    cps.push(this.controlPointsForSegment_.apply(this, segment));
  }
  return cps;
};

ole3.wrapper.BezierString.prototype.loadFromControlPoints_ = function(cps) {
  var lastBezier = null;
  for (var i = 0, ii = cps.length - 1; i <= ii; i++) {
    var bezier = new ole3.bezier.Curve(cps[i], this);
    var handle = new ole3.bezier.Control(this, lastBezier, bezier);
    this.pushPart_(bezier, handle);
    lastBezier = bezier;
  }
  var handle = new ole3.bezier.Control(this, lastBezier, null);
  this.pushPart_(null, handle);
};

ole3.wrapper.BezierString.prototype.controlPointsForSegment_ =
    function(start, end) {
  var diff = ole3.lib.olinternals.coordinate.sub(end.slice(), start);
  ole3.lib.olinternals.coordinate.scale(diff, 1 / 3);
  return [
    start,
    ol.coordinate.add(start.slice(), diff),
    ole3.lib.olinternals.coordinate.sub(end.slice(), diff),
    end
  ];
};
