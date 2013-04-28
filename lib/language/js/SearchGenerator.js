/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

/**
 * Generator module for the search logic of the documentation
 */
(function () {
    
    "use strict";
    
    var _           = require("underscore")._,
        fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");
        
    /**
     * Generates the search logic
     * @param {Object} module A module object
     * @param {string} output Base output folder
     */
    function generate(modules, output) {
        var modulesIndex = _.map(modules, function (module) {
            return {
                name: module.name,
                value: module.docPath + module.name,
                tokens: module.name.split(/(?=[A-Z])/).concat(module.name)
            };
        });
        
        var template = fs.readFileSync(path.join(output, "assets/js/main.js"), "UTF-8");
        var result = Mustache.render(template, {modules: JSON.stringify(modulesIndex)});
        fs.writeFileSync(path.join(output, "assets/js/main.js"), result, "UTF-8");
    }
    
    exports.generate = generate;
    
}());