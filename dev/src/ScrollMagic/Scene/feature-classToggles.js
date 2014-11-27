var 
	_cssClasses,
	_cssClassElems = [];
/**
 * Define a css class modification while the scene is active.  
 * When the scene triggers the classes will be added to the supplied element and removed, when the scene is over.
 * If the scene duration is 0 the classes will only be removed if the user scrolls back past the start position.
 * @public
 * @example
 * // add the class 'myclass' to the element with the id 'my-elem' for the duration of the scene
 * scene.setClassToggle("#my-elem", "myclass");
 *
 * // add multiple classes to multiple elements defined by the selector '.classChange'
 * scene.setClassToggle(".classChange", "class1 class2 class3");
 *
 * @param {(string|object)} element - A Selector targeting one or more elements or a DOM object that is supposed to be modified.
 * @param {string} classes - One or more Classnames (separated by space) that should be added to the element during the scene.
 *
 * @returns {Scene} Parent object for chaining.
 */
 // TODO: check if removeClassToggle needs a definite element (what happens if you call setClassToggle two times for same or different elements?)
this.setClassToggle = function (element, classes) {
	var elems = __getElements(element);
	if (elems.length === 0 || !__isString(classes)) {
		log(1, "ERROR calling method 'setClassToggle()': Invalid " + (elems.length === 0 ? "element" : "classes") + " supplied.");
		return Scene;
	}
	_cssClasses = classes;
	_cssClassElems = elems;
	Scene.on("enter.internal_class leave.internal_class", function (e) {
		var toggle = e.type === "enter" ? __addClass : __removeClass;
		_cssClassElems.forEach(function (elem, key) {
			toggle(elem, _cssClasses);
		});
	});
	return Scene;
};

/**
 * Remove the class binding from the scene.
 * @public
 * @example
 * // remove class binding from the scene without reset
 * scene.removeClassToggle();
 *
 * // remove class binding and remove the changes it caused
 * scene.removeClassToggle(true);
 *
 * @param {boolean} [reset=false] - If `false` and the classes are currently active, they will remain on the element. If `true` they will be removed.
 * @returns {Scene} Parent object for chaining.
 */
this.removeClassToggle = function (reset) {
	if (reset) {
		_cssClassElems.forEach(function (elem, key) {
			__removeClass(elem, _cssClasses);
		});
	}
	Scene.off("start.internal_class end.internal_class");
	_cssClasses = undefined;
	_cssClassElems = [];
	return Scene;
};