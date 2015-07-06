goog.provide('ole3.control.Toolbar');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.control.Control');
goog.require('ol.Collection');
goog.require('ol.css');

ole3.control.ToolEventTypes = {
    WILL_ENABLE: 'willEnable',
    WILL_DISABLE: 'willDisable'
}

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

    this.tools_.push(new ole3.control.Tool());
    this.tools_.push(new ole3.control.Tool());
    this.tools_.push(new ole3.control.Tool());

    this.emptyTool_;
    if (this.tools_.getLength() === 0) {
        this.emptyTool_ = /** @implements {ole3.control.ToolI} */ {
            /**
             * @inheritDoc
             */
            getElement: function() {
                return goog.dom.createTextNode('Empty Toolbar');
            }
        };
        this.tools_.push(this.emptyTool_);
    }
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

/**
 * Base class for tools.
 * @param {[type]} opt_options [description]
 * @implements {ole3.control.ToolI}
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ole3.control.Tool = function(opt_options) {
    var options = goog.isDef(opt_options) ? opt_options : {};

    this.enableHandler_ = options['enableHandler'] || goog.nullFunction;
    this.disableHandler_ = options['disableHandler'] || goog.nullFunction;

    this.element_ = goog.dom.createDom(goog.dom.TagName.BUTTON,
        '',
        goog.dom.createTextNode('B'));

    goog.events.listen(this.element_, goog.events.EventType.CLICK,
            this.handleClick_, false, this);

    this.active_ = false;

    goog.base(this);
};
goog.inherits(ole3.control.Tool, goog.events.EventTarget);

/**
 * @inheritDoc
 */
ole3.control.Tool.prototype.getElement = function() {
    return this.element_;
};

/**
 * Handle click on button. Calls activateHandler or deactivateHandler
 * appropriately and changes the toggle status.
 * @param  {[type]} evt [description]
 * @private
 */
ole3.control.Tool.prototype.handleClick_ = function(evt) {
    var evt = this.active_ ? ole3.control.ToolEventTypes.WILL_DISABLE :
            ole3.control.ToolEventTypes.WILL_ENABLE;
    if (!goog.events.dispatchEvent(this, evt)) {
        return;
    }
    handler = this.active_ ? this.disableHandler_ : this.enableHandler_;
    handler(evt);
    this.active_ = !this.active_;
};

/**
 * @inheritDoc
 */
ole3.control.Tool.prototype.disable = function() {
    goog.events.dispatchEvent(this, ole3.control.ToolEventTypes.WILL_DISABLE);
    this.disableHandler_();
    this.active_ = false;
};
