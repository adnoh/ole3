goog.provide('ole3.interaction.BezierModify');

goog.require('goog.functions');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.events.condition');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Pointer');
goog.require('ole3.feature.Bezier');
goog.require('ole3.feature.BezierString');

/**
 * @typedef {{depth: (Array.<number>|undefined),
 *            feature: ol.Feature,
 *            geometry: ol.geom.SimpleGeometry,
 *            index: (number),
 *            length: (number),
 *            bezier: Array.<ol.Coordinates>}}
 */
ol.interaction.BezierCurveDataType;

/**
 * Interaction for modifiying LineStrings as bezier curves.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.ModifyOptions} options Options
 */
ole3.interaction.BezierModify = function(options) {

  goog.base(this, {
    handleDownEvent: ole3.interaction.BezierModify.handleDownEvent_,
    handleDragEvent: ole3.interaction.BezierModify.handleDragEvent_,
    handleEvent: ole3.interaction.BezierModify.handleEvent,
    handleUpEvent: ole3.interaction.BezierModify.handleUpEvent_
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
   * Current dragged bezier information
   * @type {ole3.structs.ClosestHandleDescriptor}
   * @private
   */
  this.currentControl_ = null;

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.lastPixel_ = [0, 0];

  this.handlingDownUpSequence = false;

  /**
   * Segment RTree for each layer
   * @type {Object.<*, ol.structs.RBush>}
   * @private
   */
  this.rBush_ = new ol.structs.RBush();

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
  this.overlay_ = new ol.FeatureOverlay({
    style: goog.isDef(options.style) ? options.style :
        ol.interaction.Modify.getDefaultStyleFunction()
  });

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
  goog.events.listen(this.features_, ol.CollectionEventType.ADD,
      this.handleFeatureAdd_, false, this);
  goog.events.listen(this.features_, ol.CollectionEventType.REMOVE,
      this.handleFeatureRemove_, false, this);

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
  var map = this.getMap();
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
  var i, bezierCurvesToRemove = [];
  rBush.forEachInExtent(feature.getGeometry().getExtent(),
      function(bezierCurve) {
    if (feature === bezierCurve.feature) {
      bezierCurvesToRemove.push(bezierCurve);
    }
  });
  for (i = bezierCurvesToRemove.length; i > 0; --i) {
    goog.array.map(bezierCurvesToRemove[i].handles, this.overlay_.removeFeature,
        this.overlay_);
    rBush.remove(bezierCurvesToRemove[i]);
  }
};

/**
 * @inheritDoc
 */
ole3.interaction.BezierModify.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  goog.base(this, 'setMap', map);
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
  var feature = evt.element;
  this.removeFeature_(feature);
  // There remains only vertexFeature…
  if (!goog.isNull(this.vertexFeature_) /*&&
      this.features_.getLength() === 0*/) {
    this.overlay_.removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
};

/**
 * Handles the {@link ol.MapBrowserEvent map browser event} and may modify the
 * geometry.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.Modify}
 */
ole3.interaction.BezierModify.handleEvent = function(mapBrowserEvent) {
  var handled;
  if (!mapBrowserEvent.map.getView().getHints()[ol.ViewHint.INTERACTING] &&
      mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERMOVE &&
      !this.handlingDownUpSequence_) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  if (!goog.isNull(this.vertexFeature_) &&
      this.deleteCondition_(mapBrowserEvent)) {
    var geometry = this.vertexFeature_.getGeometry();
    goog.asserts.assertInstanceof(geometry, ol.geom.Point,
        'geometry should be an ol.geom.Point');
    handled = this.removeVertex_();
  }
  return ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent) &&
      !handled;
};

ole3.interaction.BezierModify.prototype.removeVertex_ = function() {
  var currentBezier = this.currentBezier_;
  if (currentBezier.point.type === ole3.feature.bezierPoint.CONTROL) {
    var result = currentBezier.node.bezierString.reset(currentBezier.bezier, currentBezier.point.index);
    goog.array.map(result.changed, this.reIndexBezier, this);
    var fixFirstFn = function(f, first) {
      return function(second) {
        return f.call(this, first, second);
      }
    };
    goog.array.map(result.added, fixFirstFn(this.indexBezier_, currentBezier.node.bezierString), this);
    goog.array.map(result.removed, this.removeBezier_, this);
    this.overlay_.removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
};

/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
ole3.interaction.BezierModify.prototype.handlePointerMove_ = function(evt) {
  this.lastPixel_ = evt.pixel;
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};

/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Map} map Map.
 * @private
 */
ole3.interaction.BezierModify.prototype.handlePointerAtPixel_ =
    function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = ol.extent.boundingExtent([lowerLeft, upperRight]);
  var pixelDistance = this.pixelDistance_;
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
      if (!prev) { return curr; }
      if (prev.snapable != curr.snapable) {
        var snap = curr.snapable ? curr : prev;
        if (snapFn(snap.coordinate)) { return snap; }
      }
      return curr.sqDistance < prev.sqDistance ? curr : prev;
    });
    this.currentControl_ = cp ? cp.handlePoint : null;
  } else {
    this.currentControl_ = null;
  }
  this.updateVertexFeature_();
};

// ole3.interaction.BezierModify.prototype.setCurrentBezier_ = function(point, node) {
//   if (!goog.isDef(point)) {
//     this.currentBezier_ = null;
//   }
//   this.currentBezier_ = {
//     point: point,
//     bezier: node.bezier,
//     node: node
//   };
// };

ole3.interaction.BezierModify.prototype.pixelDistance_ = function(coord1, coord2, map) {
  var c1Pixel = map.getPixelFromCoordinate(coord1);
  var c2Pixel = map.getPixelFromCoordinate(coord2);
  return Math.sqrt(ol.coordinate.squaredDistance(c1Pixel, c2Pixel));
};

/**
 * Updates the current Vertex based on the selected controlpoint
 * @return {ol.Feature} Vertex feature.
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
  return vtx;
};

/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.LineString} geometry Geometry.
 * @private
 */
ole3.interaction.BezierModify.prototype.writeLineStringGeometry_ =
    function(feature, geometry) {
  var bezierString = new ole3.feature.BezierString(feature);
  var handles = bezierString.getHandleFeatures();
  handles.forEach(this.addHandle_, this);
  handles.on('add', this.handleAddHandle_, this);
  handles.on('remove', this.handleRemoveHandle_, this);
  this.indexBezierString_(bezierString);

  // var beziers = bezierString.getBeziers();
  // var rBush = this.rBush_;
  // var fixFirstFn = function(f, first) {
  //   return function(second) {
  //     return f.call(this, first, second);
  //   }
  // };
  // beziers.forEach(fixFirstFn(this.indexBezier_, bezierString), this);
};

ole3.interaction.BezierModify.prototype.indexBezier_ = function(bezierString, bezier) {
  var node = {
      bezierString: bezierString,
      bezier: bezier
  };
  this.rBush_.insert(bezier.getExtent(), node, this);
  return node;
};

/**
 * Adds the given bezierString to the spatial index.
 * @param  {ole3.feature.BezierString} bezierString BezierString to index.
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
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
ole3.interaction.BezierModify.handleDownEvent_ = function(evt) {
  if (!goog.isNull(this.vertexFeature_)) {
    this.handlingDownUpSequence_ = true;
    return true;
  }
  else {
    return false;
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @this {ol.interaction.Modify}
 * @private
 */
ole3.interaction.BezierModify.handleDragEvent_ = function(evt) {
  var cp = this.currentControl_;
  var coordinate = evt.coordinate;
  this.currentControl_ = cp.moveTo(coordinate);
  this.updateVertexFeature_();

  // if (currentBezier.point.type == ole3.feature.bezierPoint.CURVE) {
  //   var oldBezier = currentBezier.bezier;
  //   var oldNode;
  //   var newBeziers = currentBezier.node.bezierString.splitBezier(oldBezier,
  //      currentBezier.point.parameter);
  //   this.rBush_.forEachInExtent(oldBezier.getExtent(), function(node) {
  //     if (node.bezier === oldBezier) {
  //       oldNode = node;
  //     }
  //   });
  //   this.rBush_.remove(oldNode);
  //   var fixFirstFn = function(f, first) {
  //     return function(second) {
  //       return f.call(this, first, second);
  //     }
  //   };
  //   var newNodes = goog.array.map(newBeziers, fixFirstFn(this.indexBezier_,
  //       currentBezier.node.bezierString), this);
  //   this.setCurrentBezier_(newNodes[0].bezier.closestControlPoint(coordinate),
  //       newNodes[0]);
  // }
  // currentBezier.bezier.changeControlPoint(currentBezier.point.index, coordinate);
};

/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
ole3.interaction.BezierModify.handleUpEvent_ = function(evt) {
  if (this.handlingDownUpSequence_ == true) {
    var affected = this.currentControl_.getBezierString();
    var rBush = this.rBush_;
    rBush.update(affected.getExtent(), affected);
    this.currentControl_ = null;
    this.updateVertexFeature_();
    this.handlingDownUpSequence_ = false;
    // var secondBezier = null;
    // if (this.currentBezier_.point.index == 0) {
    //   secondBezier = this.currentBezier_.bezier.getPredecessor();
    // } else if (this.currentBezier_.point.index == 3) {
    //   secondBezier = this.currentBezier_.bezier.getSucessor();
    // }
    // if (!goog.isNull(secondBezier)) {
    //   this.reIndexBezier(secondBezier);
    // }
    // this.handlingDownUpSequence_ = false;
  }
};

ole3.interaction.BezierModify.prototype.reIndexBezier = function(bezier) {
  var rBush = this.rBush_;
  var bezierNode;
  rBush.forEach(function(node) {
    if (node.bezier === bezier) {
      bezierNode = node;
    }
  });
  rBush.update(bezier.getExtent(), bezierNode);
};

ole3.interaction.BezierModify.prototype.removeBezier_ = function(bezier) {
  var rBush = this.rBush_;
  var bezierNode;
  rBush.forEach(function(node) {
    if (node.bezier === bezier) {
      bezierNode = node;
    }
  });
  rBush.remove(bezierNode);
};

/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.Modify.getDefaultStyleFunction = function() {
  var style = ol.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    if (feature.getGeometry().getType() == ol.geom.GeometryType.LINE_STRING) {
      return style[ol.geom.GeometryType.LINE_STRING];
    }
    return style[ol.geom.GeometryType.POINT];
  };
};
