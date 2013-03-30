/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

(function () {
    
    "use strict";
    
    var _           = require("underscore")._,
        deferred    = require("deferred"),
        dox         = require("dox"),
        es6         = require("es6"),
        file        = require("file"),
        fs          = require("fs"),
        fs2         = require("fs2"),
        Mustache    = require("mustache"),
        path        = require("path");
    
    var HELP_MSG = "Script generates API Documentation for Brackets project.\n" +
        "usage: node main <source-tree-root> <out-folder> [--exclude=<path>[,<path>]]\n" +
        "example: node main brackets/src doc --exclude=/thirdparty,/styles";
    
    var REQUIRE_REGEXP = new RegExp('require\\("([^"]*)"\\)', 'g');
    var EXPORTS_REGEXP = new RegExp('exports\\.([^ =]*)', 'g');
    
    var idFun = function (arg) { return arg; };
    
    /**
     * Generates the documentation index page
     * @param {Object} data Object with modules information for all the project
     * @param {string} output Path to the output folder
     */
    function generateIndexPage(data, output) {
        var template = fs.readFileSync('templates/index.html', 'UTF-8');
        var result = Mustache.render(template, data);
        fs.writeFileSync(path.join(output, "index.html"), result, 'UTF-8');
    }
    
    /**
     * Generates the documentation page for a given module
     * @param {Object} module A module object
     * @param {string} output Path to the output folder
     */
    function generateModulePage(module, output) {
        var template = fs.readFileSync('templates/module.html', 'UTF-8');
        var result = Mustache.render(template, module);
        fs.writeFileSync(path.join(output, module.name + ".html"), result, 'UTF-8');
    }
    
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
     * Combines dox parsed data for a module with some custom data
     * @param {Object} el Dox parsed data for the module
     * @param {Array.<string>} exports Array of exported variables in the module
     * @return {Object} Combined Object with dox parse data
     */
    function _postProcess(el, exports) {
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
        return el;
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
     * Finds all dependencies in a module
     * @param {data} Contents of the module
     * @return {Array.<string>} Array with all the dependencies of the module
     */
    function _findDependencies(data) {
        return _findAllMatches(REQUIRE_REGEXP, data).map(function (el) {
            return el.replace("/", ".");
        });
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
     * Analyzes and parses a module
     * @param {string} url Path of the module to analyze
     * @param {function(Object)} callback Callback method to pass the parsed module
     */
    function parseModule(url, callback) {
        fs.readFile(url, 'UTF-8', function (err, data) {
            if (err) {
                throw err;
            }
    
            var exports = _findExports(data);
            var doxResult = dox.parseComments(data, {});
    
            var moduleDescription = "";
            var functions = [];
            var variables = [];
            var classes = {};
    
            doxResult.forEach(function (el) {
                if (el.code && el.code.indexOf("define(") === 0) {
                    moduleDescription = el.description.full;
                }
    
                if (!el.ctx) {
                    return;
                }
    
                el = _postProcess(el, exports);
    
                if (el.ctx.type === 'declaration') {
                    variables.push(el);
                } else if (el.ctx.type === 'function') {
                    if (el.isConstructor) {
                        classes[el.ctx.name] = {
                            constructor: el,
                            properties: [],
                            methods: []
                        };
                    } else {
                        functions.push(el);
                    }
                } else if (el.ctx.type === 'property') {
                    if (classes[el.ctx.constructor]) {
                        classes[el.ctx.constructor].properties.push(el);
                    }
                } else if (el.ctx.type === 'method') {
                    if (classes[el.ctx.constructor]) {
                        classes[el.ctx.constructor].methods.push(el);
                    }
                }
            });
            
            var dependencies = _.sortBy(_findDependencies(data), idFun);
            
            variables = _sortMembers(variables);
            functions = _sortMembers(functions);
    
            classes = _.toArray(classes).map(function (clazz) {
                clazz.properties = _sortMembers(clazz.properties);
                clazz.methods = _sortMembers(clazz.methods);
                return clazz;
            });
    
            // TODO Throw some classes (e.g. Module) around? ;)
            callback({
                description: moduleDescription,
                dependencies: dependencies,
                exports: exports,
                functions: functions,
                variables: variables,
                classes: classes
            });
        });
    }
    
    /**
     * Parses and generates documentation for source files in the given tree.
     * @param {string} src Root of the source tree
     * @param {string} output Output folder for the generated docs
     * @param {Array.<string>} excludes Array of exclusion rules
     */
    function generateDocsForSourceTree(src, output, excludes) {
        
        var modules = [];
        
        // Gathers the modules to document
        file.walkSync(src, function (currentDir, dirs, files) {

            // TODO Generalize the concept of exclusion rule
            var ok = _.all(_.map(excludes, function (dir) {
                return currentDir.indexOf(src + dir) !== 0;
            }));
            
            if (!ok) {
                return;
            }
            
            files.forEach(function (file) {
                if (file.indexOf(".js") !== file.length - 3) {
                    return;
                }
    
                var fullPath = currentDir + "/" + file;
                var moduleName = fullPath.substring(src.length + 1, fullPath.lastIndexOf(".js")).replace(/\//g, ".");
                modules.push([fullPath, moduleName]);
            });
        });
                
        modules = _.sortBy(modules, function (module) {
            return module[1].toLowerCase();
        });
            
        // Generates documentation for each of the found modules
        modules.forEach(function (pair) {
            parseModule(pair[0], function (module) {
                module.name = pair[1];
                module.otherModules = modules;
                module.otherModulesCount = modules.length;
                generateModulePage(module, output);
            });
        });
        
        // Generates the docs index
        generateIndexPage({
            otherModules: modules,
            otherModulesCount: modules.length
        }, output);
    }
    
    /**
     * Recursively clean a directory
     * @param {string} dir Path of a directory to be cleared
     */
    function clearOutputDir(dir) {
        return fs2.rmdir(dir, { recursive: true, force: true }).then(null, function (e) {
            // Ignore "No such dir" error, otherwise propagate further
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }).then(fs2.mkdir.bind(fs2, dir));
    }
    
    /**
     * Initializes the docs generation process
     * @param {string} src Root folder of the source files to document
     * @param {string} output Output folder for the generated docs
     */
    function init(src, output, excludes) {
                
        if (!src || !output) {
            console.error("Not enough arguments\n" + HELP_MSG);
            process.exit(1);
        }
                
        clearOutputDir(output).then(function () {
            generateDocsForSourceTree(src, output, excludes || []);
        }, function (error) {
            console.error(error);
        }).end();
    }
    
    // Exports
    exports.init = init;
    
}());