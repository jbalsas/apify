/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

(function () {
    
    "use strict";
    
    var workspace = require("./utils/Workspace");

    var HELP_MSG = "Script generates API Documentation for Brackets project.\n" +
        "usage: node main <source-tree-root> <out-folder> [--exclude=<path>[,<path>]]\n" +
        "example: node main brackets/src doc --exclude=/thirdparty,/styles";
    
    /**
     * Initializes the docs generation process
     * @param {object} config A configuration object
     */
    function init(config) {
        var source      = config.source,
            output      = config.output,
            includes    = config.includes || [],
            excludes    = config.excludes || [],
            assets      = config.assets,
            templates   = config.templates;
        
        if (!source || !output) {
            console.error("Not enough arguments\n" + HELP_MSG);
            process.exit(1);
        }
        
        workspace.load(source, includes, excludes).then(function (fileset) {
            workspace.createOutputSkeleton(output, fileset, assets).then(function (fileset) {
                
                var indexGenerator  = require("./language/js/IndexGenerator"),
                    moduleParser    = require("./language/js/ModuleParser"),
                    moduleGenerator = require("./language/js/ModuleGenerator"),
                    searchGenerator = require("./language/js/SearchGenerator");
                
                fileset.files.forEach(function (file) {
                    
                    moduleParser.parse(file.fullPath).then(function (module) {
                        
                        module.name = file.name;
                        module.path = file.docPath;
                        moduleGenerator.generate(templates, module, fileset, output);
                        
                    });
                
                });
                
                indexGenerator.generate(templates, fileset, output);
                searchGenerator.generate(fileset.files, output);
            });
        });
    }
    
    // Exports
    exports.init = init;
    
}());