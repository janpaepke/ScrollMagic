// my personal logging methods
var colors = require('ansi-colors');
var log = require('fancy-log');

// internal helper
function output (method, prefix, output) {
	Array.prototype.unshift.call(output, prefix);
	method.apply(log, output);
}

module.exports = {
	error : function () {
		output(log.error, colors.red("ERROR:"), arguments);
	},
	exit : function () {
		output(log.error, colors.red("FATAL ERROR:"), arguments);
		process.exit(1);
	},
	warn : function () {
		output(log.warn, colors.yellow("WARNING:"), arguments);
	},
	info : function () {
		output(log.info, colors.blue("INFO:"), arguments);
	},
};
