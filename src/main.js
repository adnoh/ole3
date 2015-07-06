goog.provide('ole3');

goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.FullScreen');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ole3.control.Toolbar');
goog.require('ole3.tool.BezierEdit');
goog.require('ole3.tool.Modify');


/**
 * @type {ol.source.Vector}
 */
ole3.source = new ol.source.Vector();

/**
 * @type {ol.layer.Layer}
 */
ole3.layer = new ol.layer.Vector({
    source: ole3.source
});

var geoJSON = new ol.format.GeoJSON();
features = geoJSON.readFeatures('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":[[-5679576.949701736,3326539.470970871],[4339177.221692885,2025275.50144403],[-5620873.311978721,528332.7395071383],[4887077.840441029,-724011.5319171892],[-5521644.543570097,-198476.98154901946],[3900289.3109738687,-2028073.690582998],[-4738929.373929892,-1940018.2339984747]]},"properties":null}]}');
ole3.source.addFeatures(features);

/**
 * @type {ol.Map}
 */
ole3.map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 4
  })
});

var beziertool = new ole3.tool.BezierEdit({
    features: new ol.Collection(ole3.source.getFeatures())
});
var modifytool = new ole3.tool.Modify({
    features: new ol.Collection(ole3.source.getFeatures())
});

var tools = new ol.Collection();
tools.push(beziertool);
tools.push(modifytool);

ole3.map.addControl(new ole3.control.Toolbar({
  tools: tools
}));
ole3.map.addLayer(ole3.layer);
