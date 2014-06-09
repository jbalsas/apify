/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

/**
 * Generator module for the index of the documentation
 */
(function () {
    
    "use strict";
    
    var fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");
    
    /**
     * Generates the documentation index page
     * @param {Object.<string, string>} templates Map of registered templates for the current process
     * @param {Fileset} fileset File set being documented
     * @param {string} output Base output folder
     * @param {string} title Title of the project
     */
    function generate(templates, fileset, output, title) {
        var indexFolder = path.join(output, "index.html"),
            data;
        
        data = {
            level: ".",
            fileset: fileset,
            fragments: {},
            title: title
        };
        
        fs.writeFileSync(indexFolder, Mustache.render(templates.main, data, templates.partials), 'UTF-8');
    }
    
    exports.generate = generate;
    
}());