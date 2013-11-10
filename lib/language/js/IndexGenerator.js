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
    
    var FRAGMENT_REGEXP = new RegExp("\\{\\{\\{fragments\\.(.*)\\}\\}\\}", "g");
    
    /**
     * Generates the documentation index page
     * @param {Object.<string, string>} templates Map of registered templates for the current process
     * @param {Fileset} fileset File set being documented
     * @param {string} output Base output folder
     * @param {string} title Title of the project
     */
    function generate(templates, fileset, output, title) {
        var template    = fs.readFileSync(templates.index, 'UTF-8'),
            indexFolder = path.join(output, "index.html"),
            fragments   = [],
            fragment,
            data;
        
        data = {
            level: ".",
            fileset: fileset,
            fragments: {},
            title: title
        };
        
        // Parse and render first-level fragments
        // TODO Refactor for recursion and generators
        fragment = FRAGMENT_REGEXP.exec(template);
        
        if (fragment) {
            data.fragments = {};
            do {
                fragments.push(fragment[1]);
                fragment = FRAGMENT_REGEXP.exec(template);
            } while (fragment);
        }
        
        fragments.forEach(function (fragmentName) {
            var fragmentTPL = fs.readFileSync(templates[fragmentName], "UTF-8"),
                fragment    = Mustache.render(fragmentTPL, data);
                
            data.fragments[fragmentName] = fragment;
        });
        
        fs.writeFileSync(indexFolder, Mustache.render(template, data), 'UTF-8');
    }
    
    exports.generate = generate;
    
}());