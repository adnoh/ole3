/**
 * Tool for editing features.
 * @author    Jan Vogt <jan.vogt@geops.de>
 * @copyright 2015 geOps e.K.
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0
 *          GNU General Public License v2
 */

goog.provide('ole3.tool.Modify');

// goog.require('ol.interaction.Modify');
goog.require('ole3.tool.Interaction');

/**
 * Tool for editing features.
 * @param {Object} options
 *        Must include features to be editable.
 * @constructor
 * @extends {ole3.tool.Interaction}
 * @export
 */
ole3.tool.Modify = function(options) {
    var superOpts = {
        label: 'M',
        tooltip: 'Modify features'
    };
    goog.object.extend(superOpts, options);
    goog.base(this, ol.interaction.Modify, superOpts);
};
goog.inherits(ole3.tool.Modify, ole3.tool.Interaction);
