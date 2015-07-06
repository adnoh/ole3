/**
 * Tool for editing LineStrings as bezier curves.
 * @author    Jan Vogt <jan.vogt@geops.de>
 * @copyright 2015 geOps e.K.
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0
 *          GNU General Public License v2
 */

goog.provide('ole3.tool.BezierEdit');

goog.require('ole3.interaction.BezierModify');
goog.require('ole3.tool.Interaction');

/**
 * Tool for editing features.
 * @param {Object} options
 *        Must include features to be editable.
 * @constructor
 * @extends {ole3.tool.Interaction}
 */
ole3.tool.BezierEdit = function(options) {
    var superOpts = {
        label: 'B',
        tooltip: 'Modify features as bezier curves'
    };
    goog.object.extend(superOpts, options);
    goog.base(this, ole3.interaction.BezierModify, superOpts);
};
goog.inherits(ole3.tool.BezierEdit, ole3.tool.Interaction);
