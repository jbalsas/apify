var dox = require('dox');
var fs = require('fs');
var file = require('file');
var _ = require('underscore')._;
var Mustache = require('mustache');

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

function parseModule(url, cb) {
    fs.readFile(url, 'UTF-8', function (err, data) {
        if (err) throw err;

        var dependencies = _findDependencies(data);
        var exports = _findExports(data);
        var result = dox.parseComments(data);

        var moduleDescription = "";
        var functions = [];
        var variables = [];
        var classes = {};

        result.forEach(function (el) {
            if (el.code && el.code.indexOf("define(") == 0) {
                moduleDescription = el.description.full;
            }

            if (!el.ctx) return;

            if (el.ctx.type == 'declaration') {
                variables.push(el);
            } else if (el.ctx.type == 'function') {
                if (el.description.full.indexOf("@constructor") != -1) {
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

        var postProcess = function (el) {
            el.isPrivate = el.description.full.indexOf("@private") != -1 ||
                el.ctx.name[0] == "_";
            el.description.full = el.description.full.replace(/@private\s*(<br\s*\/?>)?/, "");

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
        };

        variables.forEach(postProcess);
        functions.forEach(postProcess);

        dependencies = _.sortBy(dependencies, function (el) {
            return el;
        });
        variables = _.sortBy(variables, function (el) {
            return el.ctx.name;
        });
        functions = _.sortBy(functions, function (el) {
            return el.ctx.name;
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
    fs.writeFileSync("doc/" + module.name + ".html", result, 'UTF-8');
}

function generateIndexPage(data) {
    var template = fs.readFileSync('_index.html', 'UTF-8');
    var result = Mustache.render(template, data);
    fs.writeFileSync("doc/index.html", result, 'UTF-8');
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

generateDocsForSourceTree(
    "/Users/soswow/Work/brackets/src",
    ['/thirdparty', '/styles', '/htmlContent', '/extensions']
);