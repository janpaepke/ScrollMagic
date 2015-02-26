define(function () {
	return {
		methodTests: {
			toBeOfType: function(util, customEqualityTesters) {
				return {
					compare: function(obj, objType) {
						var
							type = Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, "$1").toLowerCase(),
							result = {
								pass: objType.toLowerCase() === type
							};
							if (result.pass) {
								result.message = "Expected " + obj + " not to be of type '" + objType + "'";
							} else {
								result.message = "Expected " + obj + " to be of type '" + objType + "', but is of type '" + type + "'";
							}
						return result;
					}
				};
			},
			toWorkAsChainableSetter: function(util, customEqualityTesters) {
				return {
					compare: function(method, obj) {
						var result = {};
						try {
							result.pass = obj[method]("1") === obj;
						} catch (e) {
							e.message += ", while testing method '" + method + "' to be chainable when passing a parameter";
							throw e;
						}
						if (result.pass) {
							result.message = "Expected method '" + method + "' not to be chainable when used as setter";
						} else {
							result.message = "Expected method '" + method + "' to be chainable when used as setter";
						}
					 return result;
					}  
				};
			},
			toWorkAsGetter: function(util, customEqualityTesters) {
				return {
					compare: function(method, obj) {
						var result = {};
						try {
							result.pass = obj[method]() !== obj;
						} catch (e) {
							e.message += ", while testing method '" + method + "' without passing a parameter";
							throw e;
						}
						if (result.pass) {
							result.message = "Expected method '" + method + "' not to be a getter and return parent";
						} else {
							result.message = "Expected method '" + method + "' to be a getter and return something other than parent";
						}
					 return result;
					}  
				};
			}
		}
	};
});