jasmine.getFixtures().fixturesPath = 'base/fixtures';
var globalMatchers = {
	methodTests: {
		toBeChainableSetter: function(util, customEqualityTesters) {
			return {
				compare: function(method, obj) {
					var result = {};
						result.pass = obj[method]("1") === obj;
					try {
					} catch (e) {
						//result.pass = false;
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
		toBeGetter: function(util, customEqualityTesters) {
			return {
				compare: function(method, obj) {
					var result = {};
					try {
						result.pass = obj[method]() !== obj;
					} catch (e) {
						//result.pass = false;
					}
					if (result.pass) {
						result.message = "Expected method '" + method + "' not to be a getter";
					} else {
						result.message = "Expected method '" + method + "' to be a getter";
					}
				 return result;
				}  
			};
		}
	}
};
beforeEach(function() {
	jasmine.addMatchers(globalMatchers.methodTests);
});