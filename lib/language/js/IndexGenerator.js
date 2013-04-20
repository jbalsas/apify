/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

(function () {
    
    "use strict";
    
    var fs          = require("fs"),
        Mustache    = require("mustache"),
        path        = require("path");
    
    /**
     * Generates the documentation index page
     * @param {Object} data Object with modules information for all the project
     * @param {string} output Path to the output folder
     */
    function generate(data, output) {
        var template = fs.readFileSync('templates/index.html', 'UTF-8');
        console.log(data);
        var result = Mustache.render(template, data);
        fs.writeFileSync(path.join(output, "index.html"), result, 'UTF-8');
    }
    
    exports.generate = generate;
    
}());