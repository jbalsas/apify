/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function () {
    
    "use strict";
    
    var _           = require("underscore")._,
        deferred    = require("deferred"),
        find        = require("find");

    var PATH_REGEXP = new RegExp("^(.*/)?(?:$|(.+?)(?:(\\.[^.]*$)|$))");
    
    /**
     * Analyzes a source tree executing different sets of inclussion and exclussion
     * rules to generate a working space with the matching files
     * @param {string} src
     * @param {array.<RegExp>} includes
     * @param {array.<RegExp>} excludes
     * @return
     */
    var load = function (src, includes, excludes) {
        var groups, modules,
            def = deferred();
        
        // TODO, use includes array of regexps to add 
        // files to the workspace insted of just .js
        find.file(/\.js$/, src, function (fileSet) {
            
            // Excludes all files that match any of the exclusion rules,
            // and maps each of result to an object containing the
            // name of the file, folder and full path
            modules = fileSet.filter(function (module) {
                return excludes.every(function (rule) {
                    return !(new RegExp(rule).test(module));
                });
            }).map(function (module) {
                var data = PATH_REGEXP.exec(module);
                return {
                    fullPath: data[0],
                    path: data[1],
                    name: data[2]
                };
            });
            
            // Sorts modules alphabetically by fullPath
            modules = _.sortBy(modules, function (module) {
                return module.fullPath.toLowerCase();
            });
            
            // Groups modules based on their path and maps each
            // result to an object containing the path and package
            // of each final folder and the group of modules it contains
            groups = _.map(_.groupBy(modules, function (module) {
                return module.path;
            }), function (modules, key) {
                return {
                    p: key.replace(src, ""),
                    pkg: key.replace(src, "").replace(/\//g, ".").slice(1, -1),
                    pkg_class: key.replace(src, "").replace(/\//g, "_").slice(1, -1),
                    modules: modules
                };
            });
            
            // Resolve the promise returning a 'workspace' object
            def.resolve({
                length: modules.length,
                modules: modules,
                groups: groups
            });
        });
        
        return def.promise;
    };
    
    exports.load = load;
}());