/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

/**
 * Generator module for the modules of the documentation
 */
(function () {
    
    "use strict";
    
    var fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");
    
    var FRAGMENT_REGEXP = new RegExp("\\{\\{\\{fragments\\.(.*)\\}\\}\\}", "g");
    
    /**
     * Generates the documentation page for a given module
     * @param {Object.<string, string>} templates Map of registered templates for the current process
     * @param {Object} module A module object
     * @param {Fileset} fileset File set being documented
     * @param {string} output Base output folder
     * @param {string} title Title of the project
     */
    function generate(templates, module, fileset, output, title) {
        var template        = fs.readFileSync(templates.module, "UTF-8"),
            moduleFolder    = path.join(output, "modules", module.path),
            modulePath      = path.join(moduleFolder, module.name + ".html"),
            fragments       = [],
            fragment,
            data;
                
        data = {
            level: path.relative(moduleFolder, output),
            module: module,
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
        
        // Render and write module result
        fs.writeFileSync(modulePath, Mustache.render(template, data), "UTF-8");
    }
    
    exports.generate = generate;
    
}());