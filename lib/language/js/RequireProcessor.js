/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, module */

(function () {
    
    "use strict";
    
    var _ = require("underscore")._;
        
    var REQUIRE_REGEXP = new RegExp('require\\("([^"]*)"\\)', 'g');
    var EXPORTS_REGEXP = new RegExp('exports\\.([^ =]*)', 'g');
    
    var idFun = function (arg) { return arg; };
    
    var RequireProcessor = function (data) {
        this.rawData = data;
    };
    
    /**
     * Sorts an array of module members by their names
     * @param {Array.<Object>} The array of module members
     * @return {Array.<Object>} The sorted array
     */
    function _sortMembers(members) {
        return _.sortBy(members, function (el) {
            return el.ctx.name;
        });
    }
    

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
        return _findAllMatches(REQUIRE_REGEXP, data);
    }
    
    /**
     * 
     */
    RequireProcessor.prototype.processModule = function (module) {
        module.dependencies = _findDependencies(this.rawData);
        
        return module;
    };
    
    /**
     * Combines dox parsed data for a module with some custom data
     * @param {Object} el Dox parsed data for the module
     * @param {Array.<string>} exports Array of exported variables in the module
     * @return {Object} Combined Object with dox parse data
     */
    RequireProcessor.prototype.processComment = function (el) {
        var data = this.rawData;
        var exports = _findExports(data);
        
        if (el.ctx) {
            
            el.isPrivate = el.description.full.indexOf("@private") !== -1 ||
                el.ctx.name[0] === "_";
            el.isConstructor = el.description.full.indexOf("@constructor") !== -1;
            el.description.full = el.description.full.replace(/@private\s*(<br\s*\/?>)?/, "");
            el.description.full = el.description.full.replace(/@constructor\s*(<br\s*\/?>)?/, "");
        
            var params = [];
            el.tags = el.tags.map(function (tag) {
                if (tag.type === 'type') {
                    return {
                        key: "Type",
                        value: tag.types.join(", ")
                    };
                } else if (tag.type === "see") {
                    return {
                        key: 'See',
                        value: "<a href='#'>" + tag.local + "</a>"
                    };
                } else if (tag.type === "param" || tag.type === "return") {
                    tag.types = tag.types.join(', ');
                    if (tag.type === "return") {
                        tag.name = "Returns";
                    }
                    params.push(tag);
                    return false;
                } else if (tag.type === "private") {
                    el.isPrivate = true;
                    return false;
                }
        
                return false;
            });
        
            el.params = params;
        
            if (el.isPrivate) {
                el.tags.push({key: 'Private'});
            }
            if (_.contains(exports, el.ctx.name)) {
                el.isPublicAPI = true;
            }
            
        } else {
            
            if (el.code && (el.code.indexOf("define(") === 0)) {
                el.type = "description";
            }
            
        }
        
        return el;
    };
    
    module.exports = RequireProcessor;
    
}());