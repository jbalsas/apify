/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

/**
 * Generator module for the modules of the documentation
 */
(function () {
    
    "use strict";
    
    var fs              = require("fs"),
        Mustache        = require("mustache"),
        path            = require("path"),
        
        pathUtils       = require("../../utils/PathUtils"),
        templateUtils   = require("../../utils/TemplateUtils");
        
    /**
     * Generates the documentation page for a given module
     * @param {Object.<string, string>} templates Map of registered templates for the current process
     * @param {Object} module A module object
     * @param {Fileset} fileset File set being documented
     * @param {string} output Base output folder
     * @param {string} title Title of the project
     */
    function generate(templates, module, fileset, output, title) {
        var templates       = templateUtils.loadTemplates(templates),
            moduleFolder    = path.join(output, "modules", module.path),
            modulePath      = path.join(moduleFolder, module.name + ".html"),
            data;
                
        data = {
            level: pathUtils.normalize(path.relative(moduleFolder, output)),
            module: module,
            fileset: fileset,
            title: title
        };

        // Render and write module result
        fs.writeFileSync(modulePath, Mustache.render(templates.main, data, templates.partials), "UTF-8");
    }
    
    exports.generate = generate;
    
}());