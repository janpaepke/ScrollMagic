// my personal logging methods
var gutil = require('gulp-util');

function log (pre, out) {
	Array.prototype.unshift.call(out, pre);
	gutil.log.apply(gutil, out);
}

module.exports = {
	error : function () {
		log(gutil.colors.red("ERROR:"), arguments);
	},
	exit : function () {
		log(gutil.colors.red("ERROR:"), arguments);
		process.exit(1);
	},
	warn : function () {
		log(gutil.colors.yellow("WARNING:"), arguments);
	},
	info : function () {
		log(gutil.colors.blue("INFO:"), arguments);
	},
};