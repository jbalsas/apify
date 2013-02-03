"use strict";

require('es6');
var dox = require('dox');
var fs = require('fs');
var file = require('file');
var fs2 = require('fs2');
var path = require('path');
var _ = require('underscore')._;
var Mustache = require('mustache');
var deferred = require('deferred');

var idFun = function(arg){ return arg};

function _findAllMatches(reg, data) {
    var result = [];
    var match;

    while (match = reg.exec(data)) {
        result.push(match[1]);
    }
    return result;
}

function _findDependencies(data) {
    return _findAllMatches(/require\("([^"]*)"\)/g, data).map(function (el) {
        return el.replace("/", ".");
    });
}

function _findExports(data) {
    return _findAllMatches(/exports\.([^ =]*)/g, data);
}

function _postProcess(el, exports) {
    el.isPrivate = el.description.full.indexOf("@private") != -1 ||
        el.ctx.name[0] == "_";
    el.isConstructor = el.description.full.indexOf("@constructor") != -1;
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
            if (tag.type == "return") {
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

function _sortMembers(members){
    return _.sortBy(members, function (el) {
        return el.ctx.name;
    });
}

function parseModule(url, cb) {
    fs.readFile(url, 'UTF-8', function (err, data) {
        if (err) throw err;

        var exports = _findExports(data);
        var doxResult = dox.parseComments(data, {});

        var moduleDescription = "";
        var functions = [];
        var variables = [];
        var classes = {};

        doxResult.forEach(function (el) {
            if (el.code && el.code.indexOf("define(") == 0) {
                moduleDescription = el.description.full;
            }

            if (!el.ctx) return;

            el = _postProcess(el, exports);

            if (el.ctx.type == 'declaration') {
                variables.push(el);
            } else if (el.ctx.type == 'function') {
                if (el.isConstructor) {
                    classes[el.ctx.name] = {
                        constructor: el,
                        properties: [],
                        methods: []
                    };
                } else {
                    functions.push(el);
                }
            } else if (el.ctx.type == 'property') {
                if (classes[el.ctx.constructor]) {
                    classes[el.ctx.constructor].properties.push(el);
                }
            } else if (el.ctx.type == 'method') {
                if (classes[el.ctx.constructor]) {
                    classes[el.ctx.constructor].methods.push(el);
                }
            }
        });

        var dependencies = _.sortBy(_findDependencies(data), idFun);

        variables = _sortMembers(variables);
        functions = _sortMembers(functions);

        classes = _.toArray(classes).map(function(clazz){
            clazz.properties = _sortMembers(clazz.properties);
            clazz.methods = _sortMembers(clazz.methods);
            return clazz;
        });

        cb({
            description: moduleDescription,
            dependencies: dependencies,
            exports: exports,
            functions: functions,
            variables: variables,
            classes: classes
        });
    });
}

function generateModulePage(module) {
    var template = fs.readFileSync('_module.html', 'UTF-8');
    var result = Mustache.render(template, module);
    fs.writeFileSync(path.join(outputFolder, module.name + ".html"), result, 'UTF-8');
}

function generateIndexPage(data) {
    var template = fs.readFileSync('_index.html', 'UTF-8');
    var result = Mustache.render(template, data);
    fs.writeFileSync(path.join(outputFolder, "index.html"), result, 'UTF-8');
}

function generateDocsForSourceTree(base, excludes) {
    var modules = [];
    file.walkSync(base, function (currentDir, dirs, files) {
        var ok = _.all(_.map(excludes, function (dir) {
            return currentDir.indexOf(base + dir) != 0;
        }));
        if (!ok) return;
        files.forEach(function (file) {
            if (file.indexOf(".js") != file.length - 3) return;

            var fullPath = currentDir + "/" + file;
            var moduleName = fullPath.substring(base.length + 1, fullPath.lastIndexOf(".js")).replace(/\//g, ".");
            modules.push([fullPath, moduleName]);
        });
    });
    modules = _.sortBy(modules, function (module) {
        return module[1].toLowerCase();
    });

    modules.forEach(function (pair) {
        parseModule(pair[0], function (module) {
            module.name = pair[1];
            module.otherModules = modules;
            module.otherModulesCount = modules.length;
            generateModulePage(module);
            console.log(pair[1] + " Done!");
        });
    });
    generateIndexPage({
        otherModules: modules,
        otherModulesCount: modules.length
    });
}

function clearOutputDir() {
    return fs2.rmdir(outputFolder, { recursive: true, force: true }).then(null, function (e) {
        // Ignore "No such dir" error, otherwise propagate further
        if (e.code === 'ENOENT') return null;
        throw e;
    }).then(fs2.mkdir.bind(fs2, outputFolder));
}

var help = "Script generates API Documentation for Brackets project.\n" +
    "usage: node main <source-tree-root> <out-folder> [--exclude=<path>[,<path>]]\n" +
    "example: node main brackets/src doc --exclude=/thirdparty,/styles";

if (process.argv.length < 4) {
    console.error("Not enough arguments\n" + help);
    process.exit(1);
}
var sourceTree = process.argv[2];
var outputFolder = process.argv[3];
var excludes = [];
process.argv.slice(4).forEach(function (arg) {
    if (arg.startsWith("--exclude=")) {
        excludes = arg.substr("--exclude=".length).split(",");
    }
});

clearOutputDir().then(function () {
    generateDocsForSourceTree(sourceTree, excludes);
}, function (error) {
    console.error(error);
}).end();