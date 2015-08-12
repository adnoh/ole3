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
    if (this.active_) {
        this.disable();
    } else {
        this.enable();
    }
};

/**
 * @inheritDoc
 */
ole3.tool.Tool.prototype.enable = function() {
    if (this.map_ && !this.active_) {
        goog.events.dispatchEvent(this, ole3.control.ToolEventTypes.WILL_ENABLE);
        this.enableHandler_(this.map_);
        this.active_ = true;
    }
};

/**
 * @inheritDoc
 */
ole3.tool.Tool.prototype.disable = function() {
    if (this.map_ && this.active_) {
        goog.events.dispatchEvent(this, ole3.control.ToolEventTypes.WILL_DISABLE);
        this.disableHandler_(this.map_);
        this.active_ = false;
    }
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
