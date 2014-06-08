/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports */

/**
 * Template utilities
 */
(function () {
    
    "use strict";
    
    var _   = require("underscore")._,
        fs  = require("fs");
    
    /**
     * Loads main template and required partials.
     * @param {object} templates Config with the templates and partials to be loaded
     * @return {object} Object with the main template and the loaded partials
     */
    var loadTemplates = function (templates) {
        return {
            main: loadTemplate(templates.main),
            partials: loadPartials(templates.partials)
        };
    };
        
    var loadTemplate = function(path) {
        return fs.readFileSync(path, "UTF-8");
    };
    
    var loadPartials = function(partials) {
        var paths = {};
        
        _.each(partials, function(item, index) {
            paths[index] = loadTemplate(item);
        });
        
        return paths;
    }
    
    exports.loadTemplates = loadTemplates;
}());