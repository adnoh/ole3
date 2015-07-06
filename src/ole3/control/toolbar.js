goog.provide('ole3.control.ToolI');
goog.provide('ole3.control.Toolbar');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.Collection');
goog.require('ol.control.Control');
goog.require('ol.css');

/**
 * Event Types that should be emmited by ToolIs
 * @enum
 * @const
 */
ole3.control.ToolEventTypes = {
    WILL_ENABLE: 'willEnable',
    WILL_DISABLE: 'willDisable'
};

/**
 * Tool meant to be used in a toolbar must fullfill this interface.
 * @interface
 */
ole3.control.ToolI = function() {};

/**
 * Get element to be displayed in the toolbar.
 * @return {Node} DOM element.
 */
ole3.control.ToolI.prototype.getElement = function() {};

/**
 * Disable this Tool.
 */
ole3.control.ToolI.prototype.disable = function() {};

/**
 * Set map this tool acts upon.
 * @param {ol.Map} map Map
 */
ole3.control.ToolI.prototype.setMap = function(map) {};

/**
 * An ol.Control consisting of an configurable set of ole3.control.ToolIs
 * @param {[type]} opt_options [description]
 * @extends {ol.control.Control}
 * @constructor
 */
ole3.control.Toolbar = function(opt_options) {
    var options = goog.isDef(opt_options) ? opt_options : {};

    var toolbar = goog.dom.createDom(goog.dom.TagName.DIV, 'ole3-toolbar ' +
            ol.css.CLASS_UNSELECTABLE + ' ' + ol.css.CLASS_CONTROL);

    this.tools_ = /** @type {ol.Collection.<ole3.control.ToolI>} */
            (options['tools'] || new ol.Collection());

    this.tools_.forEach(function(tool) {
        goog.events.listen(tool, ole3.control.ToolEventTypes.WILL_ENABLE,
                this.handleToolWillEnable_, false, this);
        var el = tool.getElement();
        el.style.float = el.style.float ? el.style.float : 'left';
        goog.dom.appendChild(toolbar, el);
    }, this);

    goog.base(this, {
        element: toolbar,
        target: options.target
    });
};
goog.inherits(ole3.control.Toolbar, ol.control.Control);

/**
 * Handle activation of a tool. Currently deactivate all other tools.
 * @param  {[type]} evt [description]
 * @private
 */
ole3.control.Toolbar.prototype.handleToolWillEnable_ = function(evt) {
    this.tools_.forEach(function(tool) {
        if (evt.target !== tool) {
            tool.disable();
        }
    });
};

ole3.control.Toolbar.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    this.tools_.forEach(function(tool) {
        tool.setMap(map);
    });
};
