/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, process */

(function () {
    
    "use strict";
    
    var documenter  = require("./lib/Documenter"),
        fs          = require("fs"),
        merge       = require("fmerge"),
        path        = require("path"),
        program     = require("commander"),
        config;
    
    function parseExcludes(list) {
        return list.split(",");
    }
    
    program
        .version("0.0.1")
        .option("-s, --source <s>", "Source folder")
        .option("-o, --output <s>", "Output folder")
        .option("-c, --config <s>", "Config file")
        .option("--excludes <excludes>", "Excludes", parseExcludes)
        .parse(process.argv);
    
    if (program.config) {
        config = JSON.parse(fs.readFileSync(program.config, "UTF-8"));
        program = merge(program, config);
    }
    
    documenter.init(program);

}());