/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports */

/**
 * Manages the project workspace and creates the fileset of modules to be documented
 */
(function () {
    
    "use strict";
    
    var _           = require("underscore")._,
        deferred    = require("deferred"),
        find        = require("find"),
        fs          = require("fs"),
        fs2         = require("fs2"),
        ncp         = require("ncp"),
        marked      = require("marked"),
        path        = require("path"),
        
        pathUtils   = require("./PathUtils");

    var p_ncp   = deferred.promisify(ncp),
        p_mkdir = deferred.promisify(fs2.mkdir);
    
    var ASSETS_FOLDER   = "assets",
        MODULES_FOLDER  = "modules";
    
    var PATH_REGEXP = new RegExp("^(.*[/\\\\])?(?:$|(.+?)(?:(\\.[^.]*$)|$))");
    
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
    
    /**
     * Analyzes a source tree executing different sets of inclussion and exclussion rules to generate a working space with the matching files.
     * @param {string} src Source tree to be analyzed
     * @param {array.<RegExp>} includes Rule set for including files
     * @param {array.<RegExp>} excludes Rule set for excluding files
     * @param {object} content Map of content to embed in different sections
     * @return fileset The set of files to be documented
     */
    var load = function (src, includes, excludes, content) {
        var groups, files, 
            sections = {},
            def = deferred();
        
        // TODO, use includes array of regexps to add 
        // files to the workspace insted of just .js
        find.file(/\.js$/, src, function (fileSet) {
            
            // Excludes all files that match any of the exclusion rules,
            // and maps each of result to an object containing the
            // name of the file, folder and full path
            files = fileSet.filter(function (file) {
                return excludes.every(function (rule) {
                    return !(new RegExp(rule).test(pathUtils.normalize(file)));
                });
            }).map(function (file) {
                var data = PATH_REGEXP.exec(file);
                return {
                    fullPath: data[0],
                    path: data[1],
                    name: data[2],
                    docPath: pathUtils.normalize(data[1].replace(src, ""))
                };
            });
            
            // Sorts files alphabetically by fullPath
            files = _.sortBy(files, function (file) {
                return file.fullPath.toLowerCase();
            });
            
            // Groups files based on their path and maps each
            // result to an object containing the path and package
            // of each final folder and the group of files it contains
            groups = _.map(_.groupBy(files, function (file) {
                return file.path;
            }), function (files, key) {
                return {
                    path: key.replace(src, ""),
                    ns: key.replace(src, "").slice(0, -1) || "[root]",
                    ns_class: key.replace(src, "").replace(/[\/\\]/g, "_").slice(0, -1),
                    files: files
                };
            });
            
            _.each(content, function(item, index) {
                var contentPath = pathUtils.normalize(item),
                    content = fs.readFileSync(contentPath, 'UTF-8');
                
                sections[index] = marked(content);
            });
            
            // Resolve the promise returning a 'fileset' object
            def.resolve({
                files: files,
                groups: groups,
                length: files.length,
                sections: sections
            });
        });
        
        return def.promise;
    };
    
    /**
     * Creates the folder skeleton for all the files in a given fileset
     * @param {object} fileset The fileset to be documented
     * @param {string} folder The output folder in to which create the skeleton for the docs
     * return {Promise} A deferred promise to be resolved when the final skeleton is ready
     */
    function _createModulesSkeleton(fileset, folder) {
        var def = deferred();
        
        fs.mkdirSync(folder);
        
        deferred.map(fileset.groups, function (group) {
            return fs2.mkdir(path.join(folder, group.path), {intermediate: true});
        }).then(function () {
            def.resolve(fileset);
        });
        
        return def.promise;
    }
    
    /**
     * Recursively clean a directory
     * @param {string} dir Path of a directory to be cleaned
     */
    function _clearOutputFolder(folder) {
        return fs2.rmdir(folder, { recursive: true, force: true }).then(null, function (e) {
            // Ignore "No such dir" error, otherwise propagate further
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }).then(fs2.mkdir.bind(fs2, folder));
    }
    
    /**
     * Creates the output skeleton folders for a given fileset
     * @param {string} output Output folder for the docs
     * @param {object} fileset Fileset to be documented
     * @return {Promise} A promise to be fulfilled when the skeleton is created
     */
    var createOutputSkeleton = function (output, fileset, assets) {
        var def = deferred(),
            assetsPath = path.join(output, ASSETS_FOLDER),
            modulesPath = path.join(output, MODULES_FOLDER);
        
        _clearOutputFolder(output).then(function () {
            
            // Copy assets to output folder
            p_ncp(assets, assetsPath).then(function () {
                
                _createModulesSkeleton(fileset, modulesPath).then(function (fileset) {
                    def.resolve(fileset);
                });
                
            });
            
        });
        
        return def.promise;
    };
    
    exports.createOutputSkeleton = createOutputSkeleton;
    exports.load = load;
}());