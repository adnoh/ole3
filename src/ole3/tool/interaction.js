goog.provide('ole3.tool.Interaction');

goog.require('goog.object');
goog.require('ole3.tool.Tool');

/**
 * Tool that toggles an interaction.
 * @param {function(new:ol.interaction.Interaction, ...)} interaction
 *        Interaction constructor to be toggled
 * @param {Object} options
 *        Must include features to be editable.
 * @constructor
 * @extends {ole3.tool.Tool}
 */
ole3.tool.Interaction = function(interaction, options) {
    this.interactionCtor_ = interaction;
    var superOpts = {
        enableHandler: goog.bind(this.handleEnable_, this),
        disableHandler: goog.bind(this.handleDisable_, this)
    };
    if (options.label) {
        superOpts.label = options.label;
        goog.object.remove(options, 'label');
    }
    if (options.tooltip) {
        superOpts.tooltip = options.tooltip;
        goog.object.remove(options, 'tooltip');
    }
    goog.base(this, superOpts);

    this.interaction_ = new this.interactionCtor_(options);
};

goog.inherits(ole3.tool.Interaction, ole3.tool.Tool);

ole3.tool.Interaction.prototype.handleEnable_ = function(map) {
    map.addInteraction(this.interaction_);
};

ole3.tool.Interaction.prototype.handleDisable_ = function(map) {
    map.removeInteraction(this.interaction_);
};
