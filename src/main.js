goog.provide('ole3');

goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ole3.Editor');
goog.require('ole3.tool.BezierEdit');
goog.require('ole3.tool.Modify');

/**
 * Set up a Map
 */

var src = new ol.source.Vector();

var layer = new ol.layer.Vector({
    source: src
});

var geoJSON = new ol.format.GeoJSON();
var features = geoJSON.readFeatures('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":[[-5679576.949701736,3326539.470970871],[4339177.221692885,2025275.50144403],[-5620873.311978721,528332.7395071383],[4887077.840441029,-724011.5319171892],[-5521644.543570097,-198476.98154901946],[3900289.3109738687,-2028073.690582998],[-4738929.373929892,-1940018.2339984747]]},"properties":null}]}');
src.addFeatures(features);

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    layer
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 4
  })
});

/**
 * Generate two tools.
 */

var beziertool = new ole3.tool.BezierEdit({
    features: new ol.Collection(src.getFeatures())
});
var modifytool = new ole3.tool.Modify({
    features: new ol.Collection(src.getFeatures())
});

/**
 * Add ole3.Editor to map
 */

var editor = new ole3.Editor({
  map: map,
  tools: new ol.Collection([beziertool, modifytool])
});
