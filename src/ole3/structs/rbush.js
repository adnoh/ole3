goog.provide('ole3.structs.RBush');

goog.require('goog.array');
goog.require('mourner');

/**
 * @constructor
 */
ole3.structs.RBush = function() {
    this.rbush_ = new mourner.rbush();
    this.items_ = {};
};

/**
 * Calls fn for each element in given bounding box
 * @param  {?}   bbox [description]
 * @param  {function (this:Object, ?, number, ?): ?} fn   [description]
 * @param  {*=}   opt_this [description]
 */
ole3.structs.RBush.prototype.forEachInExtent = function(bbox, fn, opt_this) {
    var elms = this.getInExtent(bbox);
    goog.array.map(elms, fn, opt_this);
};

ole3.structs.RBush.prototype.remove = function(elm) {
    var node = this.items_[goog.getUid(elm)];
    delete this.items_[goog.getUid(elm)];
    this.rbush_.remove(node);
};

ole3.structs.RBush.prototype.insert = function(bbox, elm) {
    var node = element2node(bbox, elm);
    this.items_[goog.getUid(elm)] = node;
    this.rbush_.insert(node);
};

ole3.structs.RBush.prototype.update = function(bbox, elm) {
    var newNode = element2node(bbox, elm);
    var oldNode = this.items_[goog.getUid(elm)];
    this.items_[goog.getUid(elm)] = newNode;
    this.rbush_.remove(oldNode);
    this.rbush_.insert(newNode);
};

ole3.structs.RBush.prototype.getExtent = function() {
    return this.rbush_.data.bbox.slice();
};

ole3.structs.RBush.prototype.getAll = function() {
    return goog.array.map(this.rbush_.all(), node2element);
};

ole3.structs.RBush.prototype.getInExtent = function(bbox) {
    return goog.array.map(this.rbush_.search(bbox), node2element);
};

var element2node = function(bbox, elm) {
    var node = bbox.slice(0, 4);
    node[4] = elm;
    return node;
};

var node2element = function(node) {
    return node[4];
};
