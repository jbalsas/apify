/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

(function () {
    
    "use strict";
    
    var fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");
    
    var FRAGMENT_REGEXP = new RegExp("\\{\\{\\{fragments\\.(.*)\\}\\}\\}", "g");
    
    /**
     * Generates the documentation index page
     * @param {Object} data Object with modules information for all the project
     * @param {string} output Path to the output folder
     */
    function generate(templates, fileset, output) {
        var template    = fs.readFileSync(templates.index, 'UTF-8'),
            indexFolder = path.join(output, "index.html"),
            fragments   = [],
            fragment,
            data;
        
        data = {
            level: ".",
            fileset: fileset,
            fragments: {}
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