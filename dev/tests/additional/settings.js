jasmine.getFixtures().fixturesPath = 'base/fixtures';
var globalMatchers = {
	methodTests: {
		toBeChainableSetter: function(util, customEqualityTesters) {
			return {
				compare: function(method, obj) {
					var result = {};
					try {
						result.pass = obj[method]("1") === obj;
					} catch (e) {
						result.pass = false;
					}
					if (result.pass) {
						result.message = "Expected method '" + method + "' not to be chainable when used as setter";
					} else {
						result.message = "Expected method '" + method + "' to be chainable when used as setter";
					}
				 return result;
				}  
			}
		},
		toBeGetter: function(util, customEqualityTesters) {
			return {
				compare: function(method, obj) {
					var result = {};
					try {
						result.pass = obj[method]() !== obj;
					} catch (e) {
						result.pass = false;
					}
					if (result.pass) {
						result.message = "Expected method '" + method + "' not to be a getter";
					} else {
						result.message = "Expected method '" + method + "' to be a getter";
					}
				 return result;
				}  
			}
		}
	}
};