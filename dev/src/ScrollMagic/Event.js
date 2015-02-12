/**
 * TODO: DOCS (private for dev)
 * @class
 * @private
 */
 
ScrollMagic.Event = function (type, namespace, target, vars) {
	vars = vars || {};
	for (var key in vars) {
		this[key] = vars[key];
	}
	this.type = type;
	this.target = this.currentTarget = target;
	this.namespace = namespace || '';
	this.timeStamp = this.timestamp = Date.now();
	return this;
};