/**
 * Tool for editing LineStrings as bezier curves.
 * @author    Jan Vogt <jan.vogt@geops.de>
 * @copyright 2015 geOps e.K.
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0
 *          GNU General Public License v2
 */

goog.provide('ole3.tool.BezierEdit');

goog.require('ole3.interaction.BezierModify');
goog.require('ole3.tool.Tool');

/**
 * Tool for editing features as bezier curves.
 * @param {olx.interaction.ModifyOptions} options
 *        Must include features to be editable.
 * @constructor
 * @extends {ole3.tool.Tool}
 * @export
 */
ole3.tool.BezierEdit = function(options) {
    this.opt_ = options;
    this.interaction_ = null;
    var superOpts = {
        enableHandler: goog.bind(this.handleEnable_, this),
        disableHandler: goog.bind(this.handleDisable_, this),
        label: 'B',
        tooltip: 'Modify features as bezier curves'
    };
    goog.base(this, superOpts);
};
goog.inherits(ole3.tool.BezierEdit, ole3.tool.Tool);

ole3.tool.BezierEdit.prototype.handleEnable_ = function(map) {
    this.interaction_ = new ole3.interaction.BezierModify(this.opt_);
    map.addInteraction(this.interaction_);
};

ole3.tool.BezierEdit.prototype.handleDisable_ = function(map) {
    map.removeInteraction(this.interaction_);
    this.interaction_ = null;
};
