goog.provide('ole3.control.ToolI');
goog.provide('ole3.control.Toolbar');

goog.require('goog.dom');
goog.require('goog.events');
// goog.require('ol.Collection');
// goog.require('ol.control.Control');
goog.require('ole3.lib.olinternals.css');
goog.require('ole3.lib.olinternals.CollectionEventType');


/**
 * Event Types that should be emmited by ToolIs
 * @enum {string}
 */
ole3.control.ToolEventTypes = {
    WILL_ENABLE: 'willEnable',
    WILL_DISABLE: 'willDisable'
};

/**
 * Tool meant to be used in a toolbar must fullfill this interface.
 * @interface
 * @extends {goog.events.Listenable}
 */
ole3.control.ToolI = function() {};

/**
 * Get element to be displayed in the toolbar.
 * @return {Node} DOM element.
 */
ole3.control.ToolI.prototype.getElement = function() {};

/**
 * Enable this tool.
 */
ole3.control.ToolI.prototype.enable = function() {};

/**
 * Disable this tool.
 */
ole3.control.ToolI.prototype.disable = function() {};

/**
 * Set map this tool acts upon.
 * @param {ol.Map} map Map
 */
ole3.control.ToolI.prototype.setMap = function(map) {};

/**
 * An ol.Control consisting of an configurable set of ole3.control.ToolIs
 * @param {{tools: (Array<ole3.control.ToolI>|undefined),
 *          target: (Element|string|undefined)}} opt_options
 *         Options for toolbar.
 * @extends {ol.control.Control}
 * @constructor
 */
ole3.control.Toolbar = function(opt_options) {
    var options = goog.isDef(opt_options) ? opt_options : {};

    this.elemend_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ole3-toolbar ' +
            ole3.lib.olinternals.css.CLASS_UNSELECTABLE + ' ' +
            ole3.lib.olinternals.css.CLASS_CONTROL);

    this.tools_ = /** @type {ol.Collection.<ole3.control.ToolI>} */
            (new ol.Collection(options.tools));
    // Fix for wierd bug described in ole3.bezier.Curve.prototype.getLUT_
    this.tools_ = this.tools_;
    this.tools_.forEach(this.addTool_, this);
    this.tools_.on(ole3.lib.olinternals.CollectionEventType.ADD,
            function(evt) { this.addTool_(evt.element) }, this);
    this.tools_.on(ole3.lib.olinternals.CollectionEventType.REMOVE,
            function(evt) { this.removeTool_(evt.element) }, this);

    goog.base(this, {
        element: this.elemend_,
        target: options.target
    });
    this.map_ = null;
};
goog.inherits(ole3.control.Toolbar, ol.control.Control);

/**
 * Handle activation of a tool. Currently deactivate all other tools.
 * @param  {Object} evt Event descriptor
 * @private
 */
ole3.control.Toolbar.prototype.handleToolWillEnable_ = function(evt) {
    this.tools_.forEach(function(tool) {
        if (evt.target !== tool) {
            tool.disable();
        }
    });
};

/**
 * @inheritDoc
 */
ole3.control.Toolbar.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    this.tools_.forEach(function(tool) {
        tool.setMap(map);
    });
    this.map_ = map;
};

/**
 * Add a tool to this Toolbar.
 * @param {ole3.control.ToolI} tool Tool to add
 */
ole3.control.Toolbar.prototype.addTool = function(tool) {
    this.tools_.push(tool);
};

/**
 * Remove a tool from this Toolbar.
 * @param  {ole3.control.ToolI} tool Tool to remove
 */
ole3.control.Toolbar.prototype.removeTool = function(tool) {
    this.tools_.remove(tool);
};

/**
 * Add tool internally.
 * @param {ole3.control.ToolI} tool
 * @private
 */
ole3.control.Toolbar.prototype.addTool_ = function(tool) {
    goog.events.listen(tool, ole3.control.ToolEventTypes.WILL_ENABLE,
            this.handleToolWillEnable_, false, this);
    var el = tool.getElement();
    el['style']['float'] = el['style']['float'] ?
        el['style']['float'] : 'left';
    goog.dom.appendChild(this.elemend_, el);
    if (!goog.isNull(this.map_)) { tool.setMap(this.map_); }
};

/**
 * Remove tool internally.
 * @param {ole3.control.ToolI} tool
 * @private
 */
ole3.control.Toolbar.prototype.removeTool_ = function(tool) {
    tool.disable();
    goog.events.unlisten(tool, ole3.control.ToolEventTypes.WILL_ENABLE,
            this.handleToolWillEnable_, false, this);
    var el = tool.getElement();
    goog.dom.removeNode(el);
    if (!goog.isNull(this.map_)) { tool.setMap(null); }
};
