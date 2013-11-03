/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, module */

/**
 * A custom comment post-processor to add support for require dependencies and exports
 */
(function () {
    
    "use strict";
    
    var _ = require("underscore")._;
        
    var REQUIRE_REGEXP = new RegExp('require\\("([^"]*)"\\)', 'g');
    var EXPORTS_REGEXP = new RegExp('exports\\.([^ =]*)', 'g');
        
    /**
     * A custom comment post-processor for requirejs patterns
     * @param {Object} data Raw data of the module being processed
     * @constructor
     */
    var RequireProcessor = function (data) {
        this.rawData = data;
    };

    /**
     * Finds all matches for a given rule in a block of data
     * @param {Regexp} reg Regular expression for the serach
     * @param {string} data Block of data
     * @return {Array.<string>} An array containing all matches for the regexp
     */
    function _findAllMatches(reg, data) {
        var result = [];
        var match = reg.exec(data);
        
        if (match) {
            do {
                result.push(match[1]);
                match = reg.exec(data);
            } while (match);
        }
        
        return result;
    }
    
    /**
     * Finds all exported variables in a module
     * @param {data} Contents of the module
     * @returns {Array.<string>} Array with all the exports in the module
     */
    function _findExports(data) {
        return _findAllMatches(EXPORTS_REGEXP, data);
    }
    
    /**
     * Finds all dependencies in a module
     * @param {data} Contents of the module
     * @return {Array.<string>} Array with all the dependencies of the module
     */
    function _findDependencies(data) {
        var deps = _findAllMatches(REQUIRE_REGEXP, data).map(function (dep) {
            return {
                name: dep.substr(dep.lastIndexOf('/') + 1),
                url: dep
            };
        });
        
        return deps;
    }
    
    /**
     * Parses special module conventions defined by Requirejs AMD support
     * @param {Object} module The current module being processed
     * @return {Object} Agumented module with Require support
     */
    RequireProcessor.prototype.processModule = function (module) {
        module.dependencies = _findDependencies(this.rawData);
        module.exports = _findExports(this.rawData);
        
        return module;
    };
    
    /**
     * Parses special comment conventions defined by Requirejs AMD support
     * @param {Object} comment Dox parsed data for a comment in the module
     * @return {Object} Augmented comment with Require support
     */
    RequireProcessor.prototype.processComment = function (comment) {
        var data    = this.rawData,
            exports = _findExports(data);
        
        if (comment.ctx) {
            
            if (_.contains(exports, comment.ctx.name)) {
                comment.isPublicAPI = true;
            }
            
        } else {
            
            if (comment.code && (comment.code.indexOf("define(") === 0)) {
                comment.type = "description";
            }
            
        }
        
        return comment;
    };
    
    module.exports = RequireProcessor;
    
}());