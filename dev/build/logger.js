// my personal logging methods
var gutil = require('gulp-util');

module.exports = {
	exit : function () {
		gutil.log.apply(gutil, Array.prototype.concat.apply([gutil.colors.red("ERROR:")], arguments));
		process.exit(1);
	},
	warn : function () {
		gutil.log.apply(gutil, Array.prototype.concat.apply([gutil.colors.yellow("WARNING:")], arguments));
	},
	info : function () {
		gutil.log.apply(gutil, Array.prototype.concat.apply([gutil.colors.blue("INFO:")], arguments));
	},
};