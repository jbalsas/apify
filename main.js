/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, process */

(function () {
    
    "use strict";
    
    var program     = require("commander"),
        generator   = require("./lib/JSGenerator");
    
    function parseExcludes(list) {
        return list.split(",");
    }
    
    program
        .version("0.0.1")
        .option("-l, --language [type]", "Language", "js")
        .option("-s, --source <s>", "Source folder")
        .option("-o, --output <s>", "Output folder")
        .option("--excludes <excludes>", "Excludes", parseExcludes)
        .parse(process.argv);
    
    generator.init(program.source, program.output, program.excludes);

}());