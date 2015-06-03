goog.provide('ole3.interaction.BezierModify');

goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Modify');
goog.require('ole3.BezierWrapper');

/**
 * [BezierModify description]
 * @param {olx.interaction.ModifyOptions} options Options
 * @constructor
 * @extends {ol.interaction.Modify}
 */
ole3.interaction.BezierModify = function(options) {
    /**
     * Overlay with modifyable featuers, i.e. handles for beziercurves and
     * non-bezier features.
     * @type {ol.FeatureOverlay}
     * @private
     */
    this.handleOverlay_ = new ol.FeatureOverlay();

    this.modifyableFeatures_ = new ol.Collection();

    this.BEZIER_WRITERS_ = {
        'LineString': this.writeBezierLineString_
    };
    /**
     * @type {ol.Collection.<ol.Feature>}
     * @private
     */
    this.features_ = options.features;
    this.features_.forEach(this.makeModifieable_, this);

    options.features = this.modifyableFeatures_;

    goog.base(this, options);
};
goog.inherits(ole3.interaction.BezierModify, ol.interaction.Modify);

/**
 * [makeModifieable description]
 * @param {ol.Feature} feature Feature to add
 * @private
 */
ole3.interaction.BezierModify.prototype.makeModifieable_ = function(feature) {
    var geometry = feature.getGeometry();
    if (goog.isDef(this.BEZIER_WRITERS_[geometry.getType()])) {
        var wrapper = new ole3.BezierWrapper(feature);
        var handles = wrapper.getHandles();
        goog.array.forEach(handles, this.handleOverlay_.addFeature,
                this.handleOverlay_);
        this.modifyableFeatures_.extend(handles);
    } else {
        this.modifyableFeatures_.push(feature);
    }
};

/**
 * [writeBezierLineString_ description]
 * @param  {ol.Feature} feature Feature
 * @param {ol.Geometry} geometry Geometry
 * @private
 */
ole3.interaction.BezierModify.prototype.writeBezierLineString_ =
        function(feature, geometry) {
    goog.array.forEach(geometry.getCoordinates(), this.addHandle_, this);
};

/**
 * [addHandle_ description]
 * @param {array.<array.<number>>} coordinates Coordinates
 * @param {function(ol.ObjectEvent)} handler Hander for geometry changes
 * @private
 */
ole3.interaction.BezierModify.prototype.addHandle_ =
        function(coordinates, handler) {
    var handleFeature = new ol.Feature({
        geometry: new ol.geom.Point(coordinates)
    });
    handleFeature.on('change:geometry', handler);
    this.handleOverlay_.addFeature(handleFeature);
    this.modifyableFeatures_.push(handleFeature);
};

/**
 * @inheritDoc
 */
ole3.interaction.BezierModify.prototype.setMap = function(map) {
  this.handleOverlay_.setMap(map);
  goog.base(this, 'setMap', map);
};

