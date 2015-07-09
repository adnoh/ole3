goog.provide('ole3.lib.olinternals.coordinate');
goog.provide('ole3.lib.olinternals.css');
goog.provide('ole3.lib.olinternals.CollectionEventType');
goog.provide('ole3.lib.olinternals.MapBrowserEvent.EventType');
goog.provide('ole3.lib.olinternals.style');
goog.provide('ole3.lib.olinternals.geom.GeometryType');

goog.require('goog.events.EventType');
/**
 * Calculates the point closest to the passed coordinate on the passed segment.
 * This is the foot of the perpendicular of the coordinate to the segment when
 * the foot is on the segment, or the closest segment coordinate when the foot
 * is outside the segment.
 *
 * @param {ol.Coordinate} coordinate The coordinate.
 * @param {Array.<ol.Coordinate>} segment The two coordinates of the segment.
 * @return {ol.Coordinate} The foot of the perpendicular of the coordinate to
 *     the segment.
 */
ole3.lib.olinternals.coordinate.closestOnSegment = function(coordinate, segment) {
  var x0 = coordinate[0];
  var y0 = coordinate[1];
  var start = segment[0];
  var end = segment[1];
  var x1 = start[0];
  var y1 = start[1];
  var x2 = end[0];
  var y2 = end[1];
  var dx = x2 - x1;
  var dy = y2 - y1;
  var along = (dx === 0 && dy === 0) ? 0 :
      ((dx * (x0 - x1)) + (dy * (y0 - y1))) / ((dx * dx + dy * dy) || 0);
  var x, y;
  if (along <= 0) {
    x = x1;
    y = y1;
  } else if (along >= 1) {
    x = x2;
    y = y2;
  } else {
    x = x1 + along * dx;
    y = y1 + along * dy;
  }
  return [x, y];
};

/**
 * Subtract `delta` to `coordinate`. `coordinate` is modified in place and
 * returned by the function.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate} Coordinate.
 */
ole3.lib.olinternals.coordinate.sub = function(coordinate, delta) {
  coordinate[0] -= delta[0];
  coordinate[1] -= delta[1];
  return coordinate;
};

/**
 * Scale `coordinate` by `scale`. `coordinate` is modified in place and returned
 * by the function.
 *
 * Example:
 *
 *     var coord = [7.85, 47.983333];
 *     var scale = 1.2;
 *     ol.coordinate.scale(coord, scale);
 *     // coord is now [9.42, 57.5799996]
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} scale Scale factor.
 * @return {ol.Coordinate} Coordinate.
 */
ole3.lib.olinternals.coordinate.scale = function(coordinate, scale) {
  coordinate[0] *= scale;
  coordinate[1] *= scale;
  return coordinate;
};

/**
 * @param {ol.Coordinate} coordinate1 First coordinate.
 * @param {ol.Coordinate} coordinate2 Second coordinate.
 * @return {boolean} Whether the passed coordinates are equal.
 */
ole3.lib.olinternals.coordinate.equals = function(coordinate1, coordinate2) {
  var equals = true;
  for (var i = coordinate1.length - 1; i >= 0; --i) {
    if (coordinate1[i] != coordinate2[i]) {
      equals = false;
      break;
    }
  }
  return equals;
};

/**
 * @param {ol.Coordinate} coord1 First coordinate.
 * @param {ol.Coordinate} coord2 Second coordinate.
 * @return {number} Squared distance between coord1 and coord2.
 */
ole3.lib.olinternals.coordinate.squaredDistance = function(coord1, coord2) {
  var dx = coord1[0] - coord2[0];
  var dy = coord1[1] - coord2[1];
  return dx * dx + dy * dy;
};

/**
 * The CSS class for hidden feature.
 *
 * @const
 * @type {string}
 */
ole3.lib.olinternals.css.CLASS_HIDDEN = 'ol-hidden';


/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const
 * @type {string}
 */
ole3.lib.olinternals.css.CLASS_UNSELECTABLE = 'ol-unselectable';


/**
 * The CSS class for unsupported feature.
 *
 * @const
 * @type {string}
 */
ole3.lib.olinternals.css.CLASS_UNSUPPORTED = 'ol-unsupported';


/**
 * The CSS class for controls.
 *
 * @const
 * @type {string}
 */
ole3.lib.olinternals.css.CLASS_CONTROL = 'ol-control';

/**
 * @enum {string}
 */
ole3.lib.olinternals.CollectionEventType = {
  /**
   * Triggered when an item is added to the collection.
   * @event ol.CollectionEvent#add
   * @api stable
   */
  ADD: 'add',
  /**
   * Triggered when an item is removed from the collection.
   * @event ol.CollectionEvent#remove
   * @api stable
   */
  REMOVE: 'remove'
};

/**
 * Constants for event names.
 * @enum {string}
 */
ole3.lib.olinternals.MapBrowserEvent.EventType = {

  /**
   * A true single click with no dragging and no double click. Note that this
   * event is delayed by 250 ms to ensure that it is not a double click.
   * @event ol.MapBrowserEvent#singleclick
   * @api stable
   */
  SINGLECLICK: 'singleclick',

  /**
   * A click with no dragging. A double click will fire two of this.
   * @event ol.MapBrowserEvent#click
   * @api stable
   */
  CLICK: goog.events.EventType.CLICK,

  /**
   * A true double click, with no dragging.
   * @event ol.MapBrowserEvent#dblclick
   * @api stable
   */
  DBLCLICK: goog.events.EventType.DBLCLICK,

  /**
   * Triggered when a pointer is dragged.
   * @event ol.MapBrowserEvent#pointerdrag
   * @api
   */
  POINTERDRAG: 'pointerdrag',

  /**
   * Triggered when a pointer is moved. Note that on touch devices this is
   * triggered when the map is panned, so is not the same as mousemove.
   * @event ol.MapBrowserEvent#pointermove
   * @api stable
   */
  POINTERMOVE: 'pointermove',

  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTEROVER: 'pointerover',
  POINTEROUT: 'pointerout',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
};

/**
 * Default styles for editing features.
 * @return {Object.<ole3.lib.olinternals.geom.GeometryType, Array.<ol.style.Style>>} Styles
 */
ole3.lib.olinternals.style.createDefaultEditingStyles = function() {
  /** @type {Object.<ole3.lib.olinternals.geom.GeometryType, Array.<ol.style.Style>>} */
  var styles = {};
  var white = [255, 255, 255, 1];
  var blue = [0, 153, 255, 1];
  var width = 3;
  styles[ole3.lib.olinternals.geom.GeometryType.POLYGON] = [
    new ol.style.Style(/** @type {olx.style.StyleOptions} */ ({
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.5]
      })
    }))
  ];
  styles[ole3.lib.olinternals.geom.GeometryType.MULTI_POLYGON] =
      styles[ole3.lib.olinternals.geom.GeometryType.POLYGON];

  styles[ole3.lib.olinternals.geom.GeometryType.LINE_STRING] = [
    new ol.style.Style(/** @type {olx.style.StyleOptions} */ ({
      stroke: new ol.style.Stroke({
        color: white,
        width: width + 2
      })
    })),
    new ol.style.Style(/** @type {olx.style.StyleOptions} */ ({
      stroke: new ol.style.Stroke({
        color: blue,
        width: width
      })
    }))
  ];
  styles[ole3.lib.olinternals.geom.GeometryType.MULTI_LINE_STRING] =
      styles[ole3.lib.olinternals.geom.GeometryType.LINE_STRING];

  styles[ole3.lib.olinternals.geom.GeometryType.CIRCLE] =
      styles[ole3.lib.olinternals.geom.GeometryType.POLYGON].concat(
          styles[ole3.lib.olinternals.geom.GeometryType.LINE_STRING]
      );


  styles[ole3.lib.olinternals.geom.GeometryType.POINT] = [
    new ol.style.Style(/** @type {olx.style.StyleOptions} */ ({
      image: new ol.style.Circle({
        radius: width * 2,
        fill: new ol.style.Fill({
          color: blue
        }),
        stroke: new ol.style.Stroke({
          color: white,
          width: width / 2
        })
      }),
      zIndex: Infinity
    }))
  ];
  styles[ole3.lib.olinternals.geom.GeometryType.MULTI_POINT] =
      styles[ole3.lib.olinternals.geom.GeometryType.POINT];

  styles[ole3.lib.olinternals.geom.GeometryType.GEOMETRY_COLLECTION] =
      styles[ole3.lib.olinternals.geom.GeometryType.POLYGON].concat(
          styles[ole3.lib.olinternals.geom.GeometryType.POINT]
      );

  return styles;
};

/**
 * The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, `'Circle'`.
 * @enum {string}
 * @api stable
 */
ole3.lib.olinternals.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle'
};
