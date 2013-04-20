/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, process */

(function () {
    
    "use strict";
    
    var documenter  = require("./lib/Documenter"),
        fs          = require("fs"),
        merge       = require("fmerge"),
        path        = require("path"),
        program     = require("commander"),
        config,
        defaults;
    
    function parseExcludes(list) {
        return list.split(",");
    }
    
    program
        .version("0.0.1")
        .option("-s, --source <s> [value]", "Source folder")
        .option("-o, --output <s> [value]", "Output folder")
        .option("-c, --config <s> [value]", "Config file")
        .option("--excludes <excludes>", "Excludes", parseExcludes)
        .parse(process.argv);
    
    defaults = JSON.parse(fs.readFileSync("./lib/defaults.json", "UTF-8"));
        
    if (program.config) {
        config = JSON.parse(fs.readFileSync(program.config, "UTF-8"));
    }
        
    documenter.init(merge(defaults, program, config));
    
}());