goog.provide('ole3');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.interaction.Draw');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.interaction.Modify');
goog.require('ol.Collection');

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

/**
 * @type {ol.interaction.Draw}
 */
ole3.draw = new ol.interaction.Draw({
    type: 'LineString',
    source: ole3.source
});

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

ole3.map.addInteraction(ole3.draw);
ole3.map.addLayer(ole3.layer);

ole3.edit = function() {
    ole3.map.removeInteraction(ole3.draw);
    ole3.map.addInteraction(
        new ol.interaction.Modify({
            features: new ol.Collection(ole3.source.getFeatures())
        })
    );
}
goog.exportSymbol('startEdit', ole3.edit);