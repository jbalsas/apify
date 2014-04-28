/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports */

/**
 * Path utilities
 */
(function () {
    
    "use strict";
    
    /**
     * Normalizes a path to be used in a web context.
     * @param {string} path Path to be normalized
     * @return {string} Normalized path for web. Backslashes and double slashes are replaced by single ones.
     */
    var normalize = function (path) {
        return path.replace(/^[\/\\\\]/, "").replace(/[\\]/g, "/")
    };
    
    exports.normalize = normalize;
}());