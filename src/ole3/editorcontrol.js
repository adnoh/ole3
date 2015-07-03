goog.provide('ole3.control.Editor');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.control.Control');

ole3.control.Editor = function(opt_options) {
    var options = opt_options || {};

    this.labelNode_ = /** @type {Node} */ goog.dom.createTextNode('N');

    var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'type': 'button'
    }, this.labelNode_);

    var element = goog.dom.createDom(goog.dom.TagName.DIV, 'ole3-editor ol-unselectable ol-control ol-collapsed', button);

    var this_ = this;
    var handleRotateNorth = function(e) {
        this_.getMap().getView().setRotation(0);
    };

    goog.events.listen(button, ['click', 'touchstart'], handleRotateNorth);


    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};
ol.inherits(ole3.control.Editor, ol.control.Control);
