/**
 * TODO: DOCS
 */
 
ScrollMagic.Event = function (name, vars) {
	var nameparts = name.split('.');
	vars = vars || {};
	for (var key in vars) {
		this[key] = vars[key];
	}
	this.type = nameparts[0];
	this.namespace = nameparts[1] || '';
	this.timeStamp = Date.now();
	return this;
};