brackets-api
============

API documentation generator for brackets project

Usage
-----------
First install all dependencies with `npm install`, then generate documentation with<br>
`node main <source-tree-root> <out-folder> [--exclude=<path>[,<path>]]`

*example:*<br>
`node main Users/user/Work/brackets/src doc --exclude=/thirdparty,/styles,/htmlContent,/extensions,/nls`