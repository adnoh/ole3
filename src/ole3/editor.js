/**
 * Open Layers Editor 3
 *
 * The geometry editor for Open Layers 3. This will be the sucessor to the
 * famous Open Layers Editor a.k.a. OLE, which was designed to work with
 * Open Layers 2. It is a complete reimplementation to leverage the modern
 * development tools used by Open Layers 3, such as google's closure compiler.
 * In addition to the well known featureset of OLE it adds some new and unique
 * features such as the posibility to edit geometries as bezier curves.
 * @author    Jan Vogt <jan.vogt@geops.de>
 * @copyright 2015 geOps e.K.
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0
 *          GNU General Public License v2
 */

goog.provide('ole3.Editor');
goog.provide('ole3.editor.Options');

// goog.require('ol.Collection');
// goog.require('ol.Map');
goog.require('ole3.control.ToolI');
goog.require('ole3.control.Toolbar');
/**
 * @typedef {{
 *     map: (?ol.Map|undefined),
 *     tools: (?Array<ole3.control.ToolI>|undefined)
 * }}
 */
ole3.editor.Options = {};

/**
 * ole3 editor class
 * @constructor
 * @param {ole3.editor.Options=} opt_options Editor configuration.
 * @export
 */
ole3.Editor = function(opt_options) {
    var options = opt_options || {};
    this.toolbar_ = new ole3.control.Toolbar({
        tools: options['tools']
    });
    this.setMap(options['map']);
};

/**
 * Set the map for this Editor.
 * @param {?ol.Map} map Map
 * @export
 */
ole3.Editor.prototype.setMap = function(map) {
    if (goog.isDefAndNotNull(this.map_)) {
        this.map_.removeControl(this.toolbar_);
    }
    this.map_ = map;
    if (goog.isDef(map)) { this.map_.addControl(this.toolbar_); }
};

/**
 * Add a tool to this Editor.
 * @param {ole3.control.ToolI} tool Tool to add
 * @export
 */
ole3.Editor.prototype.addTool = function(tool) {
    this.toolbar_.addTool(tool);
};

/**
 * Remove a tool from this Editor.
 * @param  {ole3.control.ToolI} tool Tool to remove
 * @export
 */
ole3.Editor.prototype.removeTool = function(tool) {
    this.toolbar_.removeTool(tool);
};
