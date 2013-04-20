/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

(function () {
    
    "use strict";
    
    var fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");

    /**
     * Generates the documentation page for a given module
     * @param {Object} module A module object
     * @param {string} output Path to the output folder
     */
    function generate(module, fileset, output) {
        var template        = fs.readFileSync('templates/module.html', 'UTF-8'),
            moduleFolder    = path.join(output, "modules", module.path),
            modulePath      = path.join(moduleFolder, module.name + ".html");

        module.level = path.relative(moduleFolder, output);
        
        var result = Mustache.render(template, {module: module, fileset: fileset});
        fs.writeFileSync(modulePath, result, 'UTF-8');
    }
    
    exports.generate = generate;
    
}());