/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, module */

/**
 * Default JS parser for the modules on the documented fileset.
 * Parses the file data using dox, and then runs the output through the different registered processors.
 */
(function () {
    
    "use strict";
    
    var _           = require("underscore")._,
        deferred    = require("deferred"),
        dox         = require("dox"),
        FileQueue   = require("filequeue"),
        marked      = require("marked");
    
    marked.setOptions(
        {
            renderer: new marked.Renderer(),
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false
        }
    );
    
    var fq = new FileQueue(10);
    
    /**
     * @constructor
     */
    var ModuleParser = function (processors) {
        this.processors = processors || [];
    };
    
    /**
     * Sorts an array of module members by their names
     * @param {Array.<Object>} The array of module members
     * @return {Array.<Object>} The sorted array
     */
    function _sortMembers(members, sortFunc) {
        sortFunc = sortFunc || function (el) {
            return el.ctx.name;
        };
        
        return _.sortBy(members, sortFunc);
    }
    
    /**
     * Analyzes and parses a module
     * @param {string} url Path of the module to analyze
     * @return {Promise} A promise to be resolved with the parsed module
     */
    ModuleParser.prototype.parse = function (file) {
        var instance = this,
            def = deferred();
        
        fq.readFile(file.fullPath, 'UTF-8', function (err, data) {
            if (err) {
                throw err;
            }
            
            var module = {
                classes: {},
                dependencies: [],
                description: "",
                name: file.name,
                exports: [],
                functions: [],
                path: file.docPath,
                variables: []
            };
            
            // Initialize processors with module loaded data
            var moduleProcessors = instance.processors.map(function (Processor) {
                return new Processor(data);
            });
            
            var parsedData  = [];
            
            try {
                parsedData = dox.parseComments(data, {raw: true});
            } catch (error) {
                console.error(error);
            }
            
            // Run the pre-process hook for the module
            moduleProcessors.forEach(function (processor) {
                if (processor.processModule) {
                    module = processor.processModule(module);
                }
            });
            
            parsedData.forEach(function (comment) {
                
                // Run the comment through all registered comment processors
                moduleProcessors.forEach(function (processor) {
                    if (processor.processComment) {
                        comment = processor.processComment(comment);
                    }
                });
                
                var context = comment.ctx;
                
                if (context) {
                    
                    if (context.type === "declaration") {
                        module.variables.push(comment);

                    } else if (context.type === "function") {
                        
                        if (comment.isConstructor) {
                            
                            module.classes[context.name] = {
                                constructor: comment,
                                properties: [],
                                methods: []
                            };
                            
                        } else {
                            
                            module.functions.push(comment);
                            
                        }

                    } else if (context.type === "method") {
                        var receiver = context.receiver || context.constructor;

                        if (module.classes[receiver]) {
                            module.classes[receiver].methods.push(comment);
                        }

                    } else if (context.type === "property") {
                        var receiver = context.receiver || context.constructor;

                        if (module.classes[receiver]) {
                            module.classes[receiver].properties.push(comment);
                        }
                    }
                    
                } else {
                    
                    if ((comment.code && comment.code.indexOf("(function ()") === 0) || comment.type === "description") {
                        module.description = marked(comment.description.full);
                        
                        // Parse associated module tags
                        _.each(comment.tags, function (tag) {
                            if (tag.type === "deprecated") {
                                module.isDeprecated = true;
                                module.deprecationMessage = tag.string;
                            }
                        });
                    }
                    
                }
            });
            
            module.dependencies = _sortMembers(module.dependencies, function (el) { return el.name.toLowerCase(); });
            module.variables = _sortMembers(module.variables);
            module.functions = _sortMembers(module.functions);
            module.classes = _.toArray(module.classes).map(function (clazz) {
                clazz.properties = _sortMembers(clazz.properties);
                clazz.methods = _sortMembers(clazz.methods);
                return clazz;
            });
            
            def.resolve(module);
        });
        
        return def.promise;
    };
    
    module.exports = ModuleParser;
    
}());