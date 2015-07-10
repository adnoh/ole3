goog.provide('ole3.tool.Interaction');
goog.provide('ole3.tool.Tool');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('ole3.control.ToolI');

/**
 * Base class for tools.
 * @param {Object} opt_options Options for tool.
 * @implements {ole3.control.ToolI}
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ole3.tool.Tool = function(opt_options) {
    var options = goog.isDef(opt_options) ? opt_options : {};

    this.enableHandler_ = options.enableHandler || goog.nullFunction;
    this.disableHandler_ = options.disableHandler || goog.nullFunction;

    var label = options.label || 'T';
    var tooltip = options.tooltip;

    label = goog.isString(label) ? goog.dom.createTextNode(label) : label;
    var attributes = {};
    if (tooltip) { attributes.title = tooltip; }

    this.element_ = goog.dom.createDom(goog.dom.TagName.BUTTON,
            attributes, label);

    goog.events.listen(this.element_, goog.events.EventType.CLICK,
            this.handleClick_, false, this);

    this.active_ = false;

    this.map_ = null;

    goog.base(this);
};
goog.inherits(ole3.tool.Tool, goog.events.EventTarget);

/**
 * @inheritDoc
 */
ole3.tool.Tool.prototype.getElement = function() {
    return this.element_;
};

/**
 * Handle click on button. Calls activateHandler or deactivateHandler
 * appropriately and changes the toggle status.
 * @param  {Object} evt Event descriptor
 * @private
 */
ole3.tool.Tool.prototype.handleClick_ = function(evt) {
    if (goog.isNull(this.map_)) { return; }
    var evtT = this.active_ ? ole3.control.ToolEventTypes.WILL_DISABLE :
            ole3.control.ToolEventTypes.WILL_ENABLE;
    if (!goog.events.dispatchEvent(this, evtT)) {
        return;
    }
    var handler = this.active_ ? this.disableHandler_ : this.enableHandler_;
    handler(this.map_);
    this.active_ = !this.active_;
};

/**
 * @inheritDoc
 */
ole3.tool.Tool.prototype.disable = function() {
    if (goog.isNull(this.map_)) { return; }
    goog.events.dispatchEvent(this, ole3.control.ToolEventTypes.WILL_DISABLE);
    this.disableHandler_(this.map_);
    this.active_ = false;
};

/**
 * @inheritDoc
 */
ole3.tool.Tool.prototype.setMap = function(map) {
    if (this.active_ && !goog.isNull(this.map_)) {
        this.disableHandler_(this.map_);
    }
    this.map_ = map;
    if (this.active_) {
        this.enableHandler_(this.map_);
    }
};

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
    this.opt_ = options;
    this.interactionCtor_ = interaction;
    this.interaction_ = null;
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
};
goog.inherits(ole3.tool.Interaction, ole3.tool.Tool);

ole3.tool.Interaction.prototype.handleEnable_ = function(map) {
    this.interaction_ = new this.interactionCtor_(this.opt_);
    map.addInteraction(this.interaction_);
};

ole3.tool.Interaction.prototype.handleDisable_ = function(map) {
    map.removeInteraction(this.interaction_);
    this.interaction_ = null;
};
