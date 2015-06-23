goog.provide('ole3.Bezier');
goog.provide('ole3.bezier');
goog.provide('ole3.feature.Bezier');
goog.provide('ole3.feature.BezierHandle');
goog.provide('ole3.feature.BezierHandlePoint');
goog.provide('ole3.feature.BezierString');
goog.provide('ole3.feature.ClosestHandleI');
goog.provide('ole3.feature.ControlHandlePoint');
goog.provide('ole3.feature.ExtentsI');
goog.provide('ole3.feature.HandlePointI');
goog.provide('ole3.feature.HandlePointType');
goog.provide('ole3.structs.ClosestHandleDescriptor');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.structs.RBush');
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

ole3.feature.HandlePointType = {
  MAIN: 0,
  LEFT: 2,
  RIGHT: 1
};

/**
 * Descriptor the closest HandlePoint.
 * @param {ole3.feature.ClosestHandleI} handlePoint Closest HandlePointI.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} sqDistance Squared Distance in currecnt coordinate system.
 * @param {boolean} snapable Wether this should be snapped to.
 * @constructor
 * @struct
 */
ole3.structs.ClosestHandleDescriptor =
    function(handlePoint, coordinate, sqDistance, snapable) {
  /**
   * Closest HandlePointI.
   * @type {ole3.feature.ClosestHandleI}
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
 * Feature that can be queryied for a closest handle.
 * @interface
 * @constructor
 */
ole3.feature.ClosestHandleI = function() {};
/**
 * Query the closest HandlePoint to coordinate
 * @param  {ol.Coordinate} coordinate Coordinate
 * @return {Object.ole3.structs.ClosestHandleDescriptor} Closest Handle.
 */
ole3.feature.ClosestHandleI.prototype.getClosestHandlePoint =
    function(coordinate) {};


/**
 * A movable point handle.
 * @interface
 */
ole3.feature.HandlePointI = function() {};
/**
 * Move this handle to new coordinate.
 * @param {ol.Coordinate} coordinate Coordinate to move to.
 * @return {ole3.feature.HandlePointI}
 *         A new handle point replacing this one. Can be different.
 */
ole3.feature.HandlePointI.prototype.moveTo = function(coordinate) {};
/**
 * Remove or reset this control point.
 */
ole3.feature.HandlePointI.prototype.remove = function() {};
/**
 * Get the Coordinate
 * @return {ol.Coordinate} Coordinate.
 */
ole3.feature.HandlePointI.prototype.getCoordinate = function() {};
/**
 * Get the underlying BezierString
 * @return {ole3.feature.BezierString} BezierString
 */
ole3.feature.HandlePointI.prototype.getBezierString = function() {};

/**
 * HandlePoint for a control point.
 * @implements {ole3.feature.HandlePointI}
 * @param {ole3.feature.BezierHandle} bezierH Affected BezierHandle
 * @param {ole3.feature.HandlePointType} point
 *        Affected controlPoint.
 * @param {ol.Coordinate} coordinate Coordinate
 * @constructor
 */
ole3.feature.ControlHandlePoint = function(bezierH, point, coordinate) {
  /**
   * Affected ControlPoint.
   * @type {ole3.feature.HandlePointType}
   * @private
   */
  this.point_ = point;

  /**
   * Affected BezierHandle
   * @type {ole3.feature.BezierHandle}
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
ole3.feature.ControlHandlePoint.prototype.moveTo = function(coordinate) {
  this.bezierHandle_.updateControlPoint(this.point_, coordinate);
  this.coordinate_ = coordinate;
  return this;
};

/**
 * @inheritDoc
 */
ole3.feature.ControlHandlePoint.prototype.remove = function() {
  this.bezierHandle_.resetControlPoint(this.point_);
};

/**
 * @inheritDoc
 */
ole3.feature.ControlHandlePoint.prototype.getCoordinate = function() {
  return this.coordinate_.slice();
};

/**
 * @inheritDoc
 */
ole3.feature.ControlHandlePoint.prototype.getBezierString = function() {
  return this.bezierHandle_.getBezierString();
};

/**
 * HandlePoint for a Point on the curve. Splits it on move.
 * @param {ole3.feature.Bezier} bezier Bezier to be split on move.
 * @param {number} parameter Point on curve, number between 0 and 1.
 * @param {ol.Coordinate} coordinate Coordinate
 * @constructor
 * @implements {ole3.feature.HandlePointI}
 */
ole3.feature.BezierHandlePoint = function(bezier, parameter, coordinate) {
  /**
   * Bezier to be split on move.
   * @type {ole3.feature.Bezier}
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
ole3.feature.BezierHandlePoint.prototype.moveTo = function(coordinate) {
  var bezier = this.bezier_;
  var par = this.parameter_;
  var newHandle = bezier.splitAt(par);
  var newHandlePoint = newHandle.mainHandlePoint();
  return newHandlePoint.moveTo(coordinate);
};

/**
 * @inheritDoc
 */
ole3.feature.BezierHandlePoint.prototype.remove = function() {};

/**
 * @inheritDoc
 */
ole3.feature.BezierHandlePoint.prototype.getCoordinate = function() {
  return this.coordinate_.slice();
};

/**
 * @inheritDoc
 */
ole3.feature.BezierHandlePoint.prototype.getBezierString = function() {
  return this.bezier_.getBezierString();
};



/**
 * Feature to be displayed between two bezier curves as handle for manipulation.
 * @param {ole3.feature.BezierString} bezierS
 *        BezierString this handle belongs to.
 * @param {?ole3.feature.Bezier} left
 *        Left hand bezier curve or null if first handle.
 * @param {?ole3.feature.Bezier} right
 *        Right hand bezier curve or null if last handle.
 * @constructor
 * @implements {ole3.feature.ClosestHandleI}
 * @implements {ole3.feature.ExtentsI}
 */
ole3.feature.BezierHandle = function(bezierS, left, right) {
  goog.asserts.assert(!(goog.isNull(left) && goog.isNull(right)),
    'At least one side needs to be a bezier curve.');

  /**
   * Left hand bezier curve or null if first handle.
   * @type {?ole3.feature.Bezier}
   * @private
   */
  this.left_ = left;

  /**
   * Right hand bezier curve or null if last handle.
   * @type {?ole3.feature.Bezier}
   * @private
   */
  this.right_ = right;

  /**
   * BezierString handle belongs to.
   * @type {ole3.feature.BezierString}.
   * @private
   */
  this.bezierS_ = bezierS;
};

/**
 * Get the BezierString
 * @return {ole3.feature.BezierString} The BezierString.
 */
ole3.feature.BezierHandle.prototype.getBezierString = function() {
  return this.bezierS_;
}

/**
 * Update ControlPoint with new coordinate.
 * @param {ole3.feature.HandlePointType} point Point to be updated.
 * @param {ol.Coordinate} coordinate New Coordinate.
 */
ole3.feature.BezierHandle.prototype.updateControlPoint =
    function(point, coordinate) {
  var left = this.left_;
  var right = this.right_;
  var types = ole3.feature.HandlePointType;
  switch (parseInt(point)) {
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
 * @param {ole3.feature.HandlePointType} point Point to be reset.
 */
ole3.feature.BezierHandle.prototype.resetControlPoint =
    function(point) {
  var left = this.left_;
  var right = this.right_;
  var bezier;
  switch (point) {
    case ole3.feature.HandlePointType.RIGHT:
      this.removeRight();
      return;
    case ole3.feature.HandlePointType.LEFT:
      bezier = left;
      break;
    case ole3.feature.HandlePointType.RIGHT:
      bezier = right;
      break;
  }
  if (!bezier) { return; }
  bezier.resetControlPoint(point);
  this.bezierS_.changeHandle(this);
};

/**
 * Create a new HandlePoint for the main ControlPoint.
 * @return {ole3.feature.HandlePointI}
 *         New HandlePoint for the main ControlPoint.
 */
ole3.feature.BezierHandle.prototype.mainHandlePoint = function() {
  var cps = this.getControlPoints();
  var type = ole3.feature.HandlePointType.MAIN
  return new ole3.feature.ControlHandlePoint(this, type, cps[type]);
};

/**
 * Get the handle geometries from the underlying Beziers.
 * @return {Array<ol.geom.LineString>} Handle geometries.
 */
ole3.feature.BezierHandle.prototype.getHandles = function() {
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
ole3.feature.BezierHandle.prototype.getClosestHandlePoint =
    function(coordinate) {
  var cps = this.getControlPoints();
  var reduce = goog.array.reduce;
  var keys = goog.object.getKeys;
  var descr = ole3.structs.ClosestHandleDescriptor;
  var closestHandlePoint = goog.array.reduce(goog.object.getKeys(cps),
      function(last, curr) {
    var sqDist = ol.coordinate.squaredDistance(cps[curr], coordinate);
    if (goog.isDef(last) && sqDist >= last.sqDistance) { return last; }
    var handlePoint =
        new ole3.feature.ControlHandlePoint(this, curr, cps[curr]);
    return new descr(handlePoint, cps[curr], sqDist, true);
  }, undefined, this);
  return closestHandlePoint;
};

/**
 * @inheritDoc
 */
ole3.feature.BezierHandle.prototype.getExtent = function() {
  var cps = this.getControlPoints();
  return ol.extent.boundingExtent(goog.object.getValues(cps));
};

/**
 * Gets all control points of this handle
 * @return {Object<{ole3.feature.HandlePointType:ol.Coordinate}>}
 *         Control Points.
 */
ole3.feature.BezierHandle.prototype.getControlPoints = function() {
  var left = this.left_;
  var right = this.right_;
  cps = {};
  if (left) {
    var leftCps = left.getControlPoints();
    cps[ole3.feature.HandlePointType.LEFT] = leftCps[2];
    cps[ole3.feature.HandlePointType.MAIN] = leftCps[3];
  }
  if (right) {
    var rightCps = right.getControlPoints();
    cps[ole3.feature.HandlePointType.RIGHT] = rightCps[1];
    if (!goog.object.containsKey(cps, ole3.feature.HandlePointType.MAIN)) {
      cps[ole3.feature.HandlePointType.MAIN] = rightCps[0];
    } else {
      goog.asserts.assert(ol.coordinate.equals(rightCps[0],
        cps[ole3.feature.HandlePointType.MAIN]),
        'Adjacent bezier curves should be connected.');
    }
  }
  return cps;
};

/**
 * Get Bezier Curves affected by this handle.
 * @return {Array<ole3.feature.Bezier>} Bezier Curves
 */
ole3.feature.BezierHandle.prototype.getBeziers = function() {
  var left = this.left_;
  var right = this.right_;
  var bez = [];
  if (left) { bez.push(left); }
  if (right) { bez.push(right); }
  return bez;
};

/**
 * Get the geometry of the left bezier curve.
 * @return {Array<ol.Coordinate>} Coordinates of left Bezier curve.
 */
// ole3.feature.BezierHandle.prototype.leftGeometry = function() {
//   var left = this.left_;
//   if (!left) { return [] }
//   return left.getGeometry();
// };

/**
 * Remove this handle if in the middle.
 */
ole3.feature.BezierHandle.prototype.removeRight = function() {
  this.bezierS_.removeHandle(this);
};

/**
 * [setRight description]
 * @param {[type]} left [description]
 */
ole3.feature.BezierHandle.prototype.setLeft = function(left) {
  this.left_ = left;
};

/**
 * Calls update on BezierString.
 * @private
 */
// ole3.feature.BezierHandle.prototype.update_ = function() {
//   this.bezierS_.update();
// };

/**
 * BezierString wraps a feature with LineString geometry as bezier curve
 * @param {ol.Feature} feature Feature to be wrapped.
 * @constructor
 */
ole3.feature.BezierString = function(feature) {
  this.feature_ = feature;
  goog.asserts.assertInstanceof(this.feature_, ol.Feature,
      'feature must be an ol.Feature');



  // this.beziers_ = new ol.Collection();
  // this.beziers_.on('add', this.handleBezierAdd_, this);
  // this.beziers_.on('remove', this.handleBezierRemove_, this);
  this.handleFeatures_ = new ol.Collection();
  this.beziers_ = [];
  this.handles_ = [];

  /**
   * All Handles of this BezierString
   * @type {ol.structs.rBush<ole3.feature.ClosestHandleI>}
   * @private
   */
  this.rBush_ = new ol.structs.RBush();

  // this.ignoreUpdate_ = false;

  // TODO: if beziers already stored
  this.bezierifyLineString_();
};

/**
 * [changeHandle description]
 * @param  {[type]} handle [description]
 */
ole3.feature.BezierString.prototype.changeHandle = function(handle) {
  var reindex = handle.getBeziers();
  reindex.push(handle);
  goog.array.map(reindex, this.reIndexSpatial_, this);
};

/**
 * [removeHandle description]
 * @param  {[type]} handle [description]
 */
ole3.feature.BezierString.prototype.removeHandle = function(handle) {
  var handleI = goog.array.find(this.handles_, goog.functions.equalTo(handle));
  var left = this.beziers_[handleI - 1];
  var right = this.beziers_[handleI];
  handles = this.handles_;
  left.combineWith(right);
  this.reIndexSpatial_(left);
  handles[handleI + 1].setLeft(left);
  this.removePartAtIndex_(handleI);
  this.updateGeometry_();
};

/**
 * [insertHandle description]
 * @param  {[type]} bezier [description]
 * @param  {[type]} handle [description]
 */
ole3.feature.BezierString.prototype.insertHandle = function(handle) {
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
 * @param  {[type]} ind [description]
 * @return {[type]}     [description]
 * @private
 */
ole3.feature.BezierString.prototype.removePartAtIndex_ = function(ind) {
  var handle = handles.splice(ind, 1)[0];
  var features = handle.getHandles();
  goog.array.map(features, this.handleFeatures_.remove, this.handleFeatures_);
  var remove = [];
  remove.push(handle);
  remove.push.apply(remove, this.beziers_.splice(ind, 1));
  goog.array.map(remove, this.removeIndexSpatial_, this);
};

/**
 * [addPartAtIndex_ description]
 * @param {[type]} ind    [description]
 * @param {[type]} bezier [description]
 * @param {[type]} handle [description]
 * @private
 */
ole3.feature.BezierString.prototype.addPartAtIndex_ =
    function(ind, bezier, handle) {
  var features = handle.getHandles();
  goog.array.map(features, this.handleFeatures_.remove, this.handleFeatures_);
  goog.array.map(features, this.handleFeatures_.push, this.handleFeatures_);
  this.beziers_.splice(ind, 0, bezier);
  this.handles_.splice(ind, 0, handle);
  console.log(ind);
  var add = [bezier, handle];
  goog.array.map(add, this.addIndexSpatial_, this);
};

ole3.feature.BezierString.prototype.pushPart_ =
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
 * @param  {[type]} extensI [description]
 * @private
 */
ole3.feature.BezierString.prototype.reIndexSpatial_ = function(extensI) {
  this.rBush_.update(extensI.getExtent(), extensI);
};

/**
 * [reIndexSpatial_ description]
 * @param  {[type]} extensI [description]
 * @private
 */
ole3.feature.BezierString.prototype.removeIndexSpatial_ = function(extensI) {
  this.rBush_.remove(extensI);
};

/**
 * [reIndexSpatial_ description]
 * @param  {[type]} extensI [description]
 * @private
 */
ole3.feature.BezierString.prototype.addIndexSpatial_ = function(extensI) {
  this.rBush_.insert(extensI.getExtent(), extensI);
};

/**
 * Gets the current extent including all handles.
 * @return {ol.Extent} Extent
 */
ole3.feature.BezierString.prototype.getExtent = function() {
  return this.rBush_.getExtent();
};

/**
 * Get the closest handlePoint with optional box.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(ol.Coordinate)boolean} snapFn
 *        Function that indicates if a coordinate is close enough to snap to.
 * @param {?ol.Extend} box optional max distance.
 * @return {?ole3.structs.ClosestHandleDescriptor} Descriptor.
 */
ole3.feature.BezierString.prototype.getClosestHandle =
    function(coordinate, snapFn, box) {
  var rb = this.rBush_;
  var handleGetters = !goog.isDef(box) ? rb.getAll() :
      rb.getInExtent(box);
  var cp = goog.array.reduce(handleGetters, function(prev, curr) {
      var cp = curr.getClosestHandlePoint(coordinate);
      if (!goog.isDef(prev)) { return cp; }
      if (cp.snapable != prev.snapable) {
        var snap = cp.snapable ? cp : prev;
        if (snapFn(snap.coordinate)) { return snap; }
      }
      return cp.sqDistance < prev.sqDistance ? cp : prev;
    });
  return cp && snapFn(cp.coordinate) ? cp : undefined;
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

// ole3.feature.BezierString.prototype.getBeziers = function() {
//   return this.beziers_;
// };

ole3.feature.BezierString.prototype.getHandleFeatures = function() {
  return this.handleFeatures_;
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

/**
 * [updateGeometry_ description]
 * @private
 */
ole3.feature.BezierString.prototype.updateGeometry_ = function() {
  var beziers = this.beziers_;
  var coord = [];
  console.log(beziers);
  for (var i = 0, ii = beziers.length; i < ii; i++) {
    var drop = i == 0 ? 0 : 1;
    var bezier = beziers[i];
    coord.push.apply(coord, bezier.getGeometry().slice(drop));
  }
  var geom = this.feature_.getGeometry();
  geom.setCoordinates(coord);
  // this.feature_.setGeometry(new ol.geom.LineString(coord));
};

ole3.feature.BezierString.prototype.bezierifyLineString_ = function() {
  // this.ignoreUpdate_ = true;
  var geometry = this.feature_.getGeometry();
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
      'only LineStrings are supported');
  var coordinates = geometry.getCoordinates();
  var lastBezier = null;
  for (var i = 0, ii = coordinates.length - 1; i < ii; i++) {
    var segment = coordinates.slice(i, i + 2);
    var bezier = new ole3.feature.Bezier(
        this.controlPointsForSegment_.apply(
        this, segment), this, segment);
    // var ind = this.beziers_.getLength() - 1;
    // if (ind >= 0) {
    //   bezier.setPredecessor(this.beziers_.item(ind));
    // }
    var handle = new ole3.feature.BezierHandle(this, lastBezier, bezier);
    this.pushPart_(bezier, handle);
    lastBezier = bezier;
  }
  var handle = new ole3.feature.BezierHandle(this, lastBezier, null);
  this.pushPart_(null, handle);
  // this.ignoreUpdate_ = false;
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
 * @implements {ole3.feature.ClosestHandleI}
 * @implements {ole3.feature.ExtentsI}
 */
ole3.feature.Bezier = function(controlPoints, bezierString, coordinates) {
  goog.base(this);
  this.controlPoints_ = controlPoints;
  this.predecessor_ = null;
  this.sucessor_ = null;
  if (!goog.isDef(coordinates)) {
    coordinates = this.getLUT_();
  }
  this.set('coordinates', coordinates);
  this.createOrUpdateHandles_();
  this.bezierS_ = bezierString;
};
goog.inherits(ole3.feature.Bezier, ol.Object);

/**
 * Get the BezierString
 * @return {ole3.feature.BezierString} The BezierString.
 */
ole3.feature.Bezier.prototype.getBezierString = function() {
  return this.bezierS_;
}


ole3.feature.Bezier.prototype.split = function(t) {
  var bezierJS = this.getBezierJS_();
  newCurves = bezierJS.split(t);
  var newBeziers = [this.fromBezierJS_(newCurves.left),
      this.fromBezierJS_(newCurves.right)];
  newBeziers[1].setPredecessor(newBeziers[0]);
  return newBeziers;
};

/**
 * @inheritDoc
 */
ole3.feature.Bezier.prototype.getExtent = function() {
  var bezierJS = this.getBezierJS_();
  var bbox = bezierJS.bbox();
  return [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
};

/**
 * Splits the current Bezier at the given point t (between 0 and 1)
 * @param  {number} t Parameter at which the curve should be split.
 * @return {ole3.feature.BezierHandle}
 *         Newly created Handle at specified point.
 */
ole3.feature.Bezier.prototype.splitAt = function(t) {
  var bezierJS = this.getBezierJS_();
  var newCurves = bezierJS.split(t);
  var newRightBezier = this.fromBezierJS_(newCurves.right);
  this.setFromBezierJS_(newCurves.left);
  var newHandle =
      new ole3.feature.BezierHandle(this.bezierS_, this, newRightBezier);
  this.bezierS_.insertHandle(newHandle);
  return newHandle;
};

/**
 * Uses the right end of b as new right ControlPoints. This is intended to be
 * used before removing b.
 * @param  {ole3.feature.Bezier} b Bezier that right end should be used.
 */
ole3.feature.Bezier.prototype.combineWith = function(b) {
  var cps = this.controlPoints_;
  var newRightSide = b.controlPoints_.slice(2);
  cps.splice.apply(cps, [2, 2].concat(newRightSide));
};

/**
 * Reset the given ControlPoint to a straight line.
 * @param  {number} i Index of the ControlPoint
 */
ole3.feature.Bezier.prototype.resetControlPoint = function(i) {
  if (i != 1 && i != 2) { return; }
  vecMath = ol.coordinate;
  var start = this.controlPoints_[0];
  var diffThird = vecMath.sub(this.controlPoints_[3].slice(), start);
  var offset = vecMath.scale(diffThird, i);
  this.controlPoints_[i] = vecMath.add(start, offset);
};

ole3.feature.Bezier.prototype.getGeometry = function() {
  return this.getLUT_();
};

// ole3.feature.Bezier.prototype.controlPoints = function() {
//   return this.controlPoints_.slice();
// };

// ole3.feature.Bezier.prototype.setPredecessor = function(bezier) {
//   this.predecessor_ = bezier;
//   if (!goog.isNull(bezier)) {
//     bezier.setSucessor(this);
//   }
// };

// ole3.feature.Bezier.prototype.getPredecessor = function() {
//   return this.predecessor_;
// };

// ole3.feature.Bezier.prototype.setSucessor = function(bezier) {
//   this.sucessor_ = bezier;
// };

// ole3.feature.Bezier.prototype.getSucessor = function() {
//   return this.sucessor_;
// };

ole3.feature.Bezier.prototype.changeControlPoint = function(index, newValue) {
  if (index == 0) {
    ol.coordinate.add(this.controlPoints_[1],
        ol.coordinate.sub(newValue.slice(), this.controlPoints_[0]));
  } else if (index == 3) {
    ol.coordinate.add(this.controlPoints_[2],
        ol.coordinate.sub(newValue.slice(), this.controlPoints_[3]));
  }
  this.controlPoints_[index] = newValue;
  this.createOrUpdateHandles_();
  this.bezierS_.updateGeometry_();
};

// ole3.feature.Bezier.prototype.closestPoint = function(coordinate) {
//   var closestCurvePoint = this.closestCurvePoint(coordinate);
//   var closestHandlePoint = this.closestControlPoint(coordinate);
//   var sqDistFn = ol.coordinate.squaredDistance;
//   return (sqDistFn(coordinate, closestCurvePoint.coordinate) <
//       sqDistFn(coordinate, closestHandlePoint.coordinate)) ?
//       closestCurvePoint : closestHandlePoint;
// };

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

/**
 * @inheritDoc
 */
ole3.feature.Bezier.prototype.getClosestHandlePoint = function(coordinate) {
  var cp = this.closestCurvePoint(coordinate);
  var descr = ole3.structs.ClosestHandleDescriptor;
  var ch = new ole3.feature.BezierHandlePoint(this, cp.parameter, cp.coordinate);
  return new descr(ch, cp.coordinate, cp.squaredDistance, false);
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

/**
 * Get the Linestring for the right handle of this Bezier curve.
 * @return {ol.geom.LineString} Right handle geometry.
 */
ole3.feature.Bezier.prototype.leftHandle = function() {
  return this.handles_[0];
};

/**
 * Get the Linestring for the right handle of this Bezier curve.
 * @return {ol.geom.LineString} Right handle geometry.
 */
ole3.feature.Bezier.prototype.rigthHandle = function() {
  return this.handles_[1];
};

/**
 * Get the Control Points of this bezier curve.
 * @return {Array<ol.Coordinate>} Copy of Control Points.
 */
ole3.feature.Bezier.prototype.getControlPoints = function() {
  return this.controlPoints_.slice();
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
  return new this.constructor(controlPoints, this.bezierS_);
};

/**
 * Updates this Curve based on the ControlPoints of c
 * @param {pomax.Bezier} c The BezierJS curve that controlpoints should be used.
 * @private
 */
ole3.feature.Bezier.prototype.setFromBezierJS_ = function(c) {
  this.controlPoints_ = goog.array.map(c.points, this.fromBezierJSCoord_);
  this.createOrUpdateHandles_();
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
