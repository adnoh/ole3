goog.provide('ole3.interaction.BezierModify');

goog.require('goog.functions');
goog.require('ole3.lib.olinternals.CollectionEventType');
goog.require('ole3.lib.olinternals.MapBrowserEvent.EventType');
goog.require('ole3.lib.olinternals.coordinate');
goog.require('ole3.lib.olinternals.geom.GeometryType');
goog.require('ole3.lib.olinternals.style');
goog.require('ole3.structs.RBush');
goog.require('ole3.wrapper.BezierString');


/**
 * Interaction for modifiying LineStrings as bezier curves.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.ModifyOptions} options Options
 */
ole3.interaction.BezierModify = function(options) {

  goog.base(this, {
        handleDownEvent: goog.bind(this.handleDownEvent_, this),
        handleDragEvent: goog.bind(this.handleDragEvent_, this),
        handleUpEvent: goog.bind(this.handleUpEvent_, this),
        handleMoveEvent: goog.bind(this.handlePointerMove_, this)
  });

  /**
   * @type {ol.events.ConditionType}
   * @private
   */
  this.deleteCondition_ = goog.isDef(options.deleteCondition) ?
      options.deleteCondition :
      /** @type {ol.events.ConditionType} */ (goog.functions.and(
          ol.events.condition.noModifierKeys,
          ol.events.condition.singleClick));

  /**
   * Editing vertex.
   * @type {ol.Feature}
   * @private
   */
  this.vertexFeature_ = null;

  /**
   * Wether a curve is currently edited.
   * @private
   */
  this.isDragging_ = false;

  /**
   * If something changed during the current drag.
   * @type {boolean}
   * @private
   */
  this.hasDragged_ = false;

  /**
   * Current dragged bezier information
   * @type {ole3.bezier.ControlPointI}
   * @private
   */
  this.currentControl_ = null;

  this.lastPixel_ = [0, 0];

  this.map_ = null;

  /**
   * Segment RTree for each layer
   * @type {Object.<*, ole3.structs.RBush>}
   * @private
   */
  this.rBush_ = new ole3.structs.RBush();

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = goog.isDef(options.pixelTolerance) ?
      options.pixelTolerance : 10;

  /**
   * Draw overlay where are sketch features are drawn.
   * @type {ol.FeatureOverlay}
   * @private
   */
  this.overlay_ = new ol.FeatureOverlay();
  this.overlay_.setStyle(goog.isDef(options.style) ? options.style :
        ole3.interaction.BezierModify.getDefaultStyleFunction())

  /**
  * @const
  * @private
  * @type {Object.<string, function(ol.Feature, ol.geom.Geometry)> }
  */
  this.BEZIER_CURVE_WRITERS_ = {
    'LineString': this.writeLineStringGeometry_
  };

  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features;

  this.features_.forEach(this.addFeature_, this);
  this.features_.on(ole3.lib.olinternals.CollectionEventType.ADD,
        this.handleFeatureAdd_, this);
  this.features_.on(ole3.lib.olinternals.CollectionEventType.REMOVE,
      this.handleFeatureRemove_, this);

};
goog.inherits(ole3.interaction.BezierModify, ol.interaction.Pointer);

/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ole3.interaction.BezierModify.prototype.addFeature_ = function(feature) {
  var geometry = feature.getGeometry();
  if (goog.isDef(this.BEZIER_CURVE_WRITERS_[geometry.getType()])) {
    this.BEZIER_CURVE_WRITERS_[geometry.getType()].
        call(this, feature, geometry);
  }
  var map = this.map_;
  if (!goog.isNull(map)) {
    this.handlePointerAtPixel_(this.lastPixel_, map);
  }
};

/**
 * Removes all bezier curves of a given feature.
 * @param {ol.Feature} feature Feature that bezier curves should be removed.
 * @private
 */
ole3.interaction.BezierModify.prototype.removeFeature_ =
    function(feature) {
  var rBush = this.rBush_;
  var i, bezierStringsToRemove = [];
  rBush.forEachInExtent(feature.getGeometry().getExtent(),
      function(bezierString) {
    if (feature === bezierString.getFeature()) {
      bezierStringsToRemove.push(bezierString);
    }
  });
  for (i = bezierStringsToRemove.length; i > 0; --i) {
    goog.array.map(bezierStringsToRemove[i].getHandleFeatures(),
        this.overlay_.removeFeature,
        this.overlay_);
    rBush.remove(bezierStringsToRemove[i]);
  }
};

/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ole3.interaction.BezierModify.prototype.handleFeatureAdd_ = function(evt) {
  var feature = evt.element;
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  this.addFeature_(feature);
};

/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ole3.interaction.BezierModify.prototype.handleFeatureRemove_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.element);
  this.removeFeature_(feature);
  // There remains only vertexFeature…
  if (!goog.isNull(this.vertexFeature_) &&
      this.features_.getLength() === 0) {
    this.overlay_.removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
};

ole3.interaction.BezierModify.prototype.removeVertex_ = function() {
  var cp = this.currentControl_;
  this.currentControl_ = cp.remove();
  this.updateVertexFeature_();
  return !this.currentControl_;
};

/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Map} map Map.
 * @private
 */
ole3.interaction.BezierModify.prototype.handlePointerAtPixel_ =
    function(pixel, map) {
  this.lastPixel_ = pixel;
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = ol.extent.boundingExtent([lowerLeft, upperRight]);
  var pixelDistance = goog.bind(this.pixelDistance_, this);
  var pixelTolerance = this.pixelTolerance_;
  var snapFn = function(coordinate) {
    return pixelDistance(coordinate, pixelCoordinate, map) <= pixelTolerance;
  };
  var rBush = this.rBush_;
  var nodes = rBush.getInExtent(box);

  if (nodes.length > 0) {
    var controlPoints = goog.array.map(nodes, function(node) {
      return node.getClosestHandle(pixelCoordinate, snapFn, box);
    });
    controlPoints = goog.array.filter(controlPoints, goog.isDef);
    var cp = goog.array.reduce(controlPoints, function(prev, curr) {
      if (goog.isNull(prev)) { return curr; }
      if (prev.snapable != curr.snapable) {
        var snap = curr.snapable ? curr : prev;
        if (snapFn(snap.coordinate)) { return snap; }
      }
      return curr.sqDistance < prev.sqDistance ? curr : prev;
    }, null);
    this.currentControl_ = cp ? cp.handlePoint : null;
  } else {
    this.currentControl_ = null;
  }
  this.updateVertexFeature_();
};

ole3.interaction.BezierModify.prototype.pixelDistance_ = function(coord1, coord2, map) {
  var c1Pixel = map.getPixelFromCoordinate(coord1);
  var c2Pixel = map.getPixelFromCoordinate(coord2);
  return Math.sqrt(ole3.lib.olinternals.coordinate.squaredDistance(c1Pixel, c2Pixel));
};

/**
 * Updates the current Vertex based on the selected controlpoint
 * @private
 */
ole3.interaction.BezierModify.prototype.updateVertexFeature_ =
    function() {
  var cp = this.currentControl_;
  var vtx = this.vertexFeature_;
  if (goog.isNull(cp)) {
    if (!goog.isNull(vtx)) {
      this.overlay_.removeFeature(vtx);
      this.vertexFeature_ = null;
    }
    return;
  }
  if (goog.isNull(vtx)) {
    vtx = new ol.Feature(new ol.geom.Point(cp.getCoordinate()));
    this.vertexFeature_ = vtx;
    this.overlay_.addFeature(vtx);
  } else {
    var geometry = /** @type {ol.geom.Point} */ (vtx.getGeometry());
    geometry.setCoordinates(cp.getCoordinate());
  }
};

/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.LineString} geometry Geometry.
 * @private
 */
ole3.interaction.BezierModify.prototype.writeLineStringGeometry_ =
    function(feature, geometry) {
  var bezierString = new ole3.wrapper.BezierString(feature);
  var handles = bezierString.getHandleFeatures();
  handles.forEach(this.addHandle_, this);
  handles.on(ole3.lib.olinternals.CollectionEventType.ADD,
      this.handleAddHandle_, this);
  handles.on(ole3.lib.olinternals.CollectionEventType.REMOVE,
      this.handleRemoveHandle_, this);
  this.indexBezierString_(bezierString);
};

/**
 * Adds the given bezierString to the spatial index.
 * @param  {ole3.wrapper.BezierString} bezierString BezierString to index.
 * @private
 */
ole3.interaction.BezierModify.prototype.indexBezierString_ = function(bezierString) {
  this.rBush_.insert(bezierString.getExtent(), bezierString);
};


ole3.interaction.BezierModify.prototype.addHandle_ = function(handle) {
  this.overlay_.addFeature(handle);
};

ole3.interaction.BezierModify.prototype.handleAddHandle_ = function(evt) {
  this.addHandle_(evt.element);
};

ole3.interaction.BezierModify.prototype.handleRemoveHandle_ = function(evt) {
  this.overlay_.removeFeature(evt.element);
};

/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
ole3.interaction.BezierModify.prototype.handlePointerMove_ = function(evt) {
  if (this.isDragging_) { return; }
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};

/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @private
 */
ole3.interaction.BezierModify.prototype.handleDownEvent_ = function(evt) {
  if (!goog.isNull(this.vertexFeature_)) {
    this.isDragging_ = true;
    return true;
  }
  else {
    return false;
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @private
 */
ole3.interaction.BezierModify.prototype.handleDragEvent_ = function(evt) {
  var cp = this.currentControl_;
  var coordinate = evt.coordinate;
  this.currentControl_ = cp.moveTo(coordinate);
  this.updateVertexFeature_();
  this.hasDragged_ = true;
};

/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Continue drag sequence?
 * @private
 */
ole3.interaction.BezierModify.prototype.handleUpEvent_ = function(evt) {
  var affected = this.currentControl_.getBezierString();
  if (!this.hasDragged_ /* && this.deleteCondition_(evt) */) {
    this.removeVertex_();
  }
  var rBush = this.rBush_;
  rBush.update(affected.getExtent(), affected);
  this.isDragging_ = this.hasDragged_ = false;
  return false;
};

ole3.interaction.BezierModify.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  this.map_ = map;
};

/**
 * @return {ol.style.StyleFunction} Styles.
 */
ole3.interaction.BezierModify.getDefaultStyleFunction = function() {
  var style = ole3.lib.olinternals.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    if (feature.getGeometry().getType() == ole3.lib.olinternals.geom.GeometryType.LINE_STRING) {
      return style[ole3.lib.olinternals.geom.GeometryType.LINE_STRING];
    }
    return style[ole3.lib.olinternals.geom.GeometryType.POINT];
  };
};
