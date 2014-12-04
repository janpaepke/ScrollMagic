/*!
 * @file Debug Extension for ScrollMagic.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ScrollMagic'], factory);
    } else {
    		// no browser global export needed, just execute
        factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic));
    }
}(this, function(ScrollMagic) {
	"use strict";

	// plugin vars
	var
		_fontSize = "0.85em",
		_zIndex = "99999",
		_edgeOffset = 10, // minimum edge distance, added to indentation
		_util = ScrollMagic._util,
		_autoindex = 0;

	/**
	 * Add Indicators for a ScrollScene.  
	 * __REQUIRES__ ScrollMagic Debug Extension: `jquery.scrollmagic.debug.js`  
	 * The indicators can only be added _AFTER_ the scene has been added to a controller.
	 * @public ScrollMagic.Scene.addIndicators

	 * @example
	 * // add basic indicators
	 * scene.addIndicators()
	 *
	 * // passing options
	 * scene.addIndicators({name: "pin scene", colorEnd: "#FFFFFF"});
	 *
	 * @param {object} [options] - An object containing one or more options for the indicators.
	 * @param {(string|object)} [options.parent=undefined] - A selector, DOM Object or a jQuery object that the indicators should be added to.  
	 														 If undefined, the controller's container will be used.
	 * @param {number} [options.name=""] - This string will be displayed at the start and end indicators of the scene for identification purposes. If no name is supplied an automatic index will be used.
	 * @param {number} [options.indent=0] - Additional position offset for the indicators (useful, when having multiple scenes starting at the same position).
	 * @param {string} [options.colorStart=green] - CSS color definition for the start indicator.
	 * @param {string} [options.colorEnd=red] - CSS color definition for the end indicator.
	 * @param {string} [options.colorTrigger=blue] - CSS color definition for the trigger indicator.
	*/

	ScrollMagic.Scene.prototype.addIndicators = function(opt) {
		var
			DEFAULT_OPTIONS = {
				name: "",
				indent: 0,
				parent: undefined,
				colorStart: "green",
				colorEnd: "red",
				colorTrigger: "blue",
			};
		
		_autoindex++;

		var
			Scene = this,
			options = _util.extend({}, DEFAULT_OPTIONS, opt),
			indicator = new Indicator(Scene, options);

		Scene.on("add.debug", indicator.add);
		Scene.on("remove.debug", indicator.remove);

		// it the scene already has a controller we can start right away.
		if (Scene.controller()) {
			indicator.add();
		}
		return Scene;
	};
	var updateTriggerGroupLabel = function (group) {
		var text = "trigger" + (group.members.length > 1 ? "" : " " + group.members[0].name);
		group.element.firstChild.firstChild.textContent = text;
	};

	var TPL = {
		start: function (color) {
			// inner element (for bottom offset -1, while keeping top position 0)
			var inner = document.createElement("div");
			inner.textContent = "start";
			_util.css(inner, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			var e = document.createElement('div');
			// wrapper
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				width: 0,
				height: 0
			});
			e.appendChild(inner);
			return e;
		},
		end: function (color) {
			var e = document.createElement('div');
			e.textContent = "end";
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			return e;
		},
		bounds: function () {
			var e = document.createElement('div');
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events" : "none",
				"font-size": _fontSize
			});
			e.style.zIndex = _zIndex;
			return e;
		},
		trigger: function (color) {
			// inner to be above or below line but keep position
			var inner = document.createElement('div');
			inner.textContent = "trigger";
			_util.css(inner, {
				position: "relative",
			});
			// inner wrapper for right: 0 and main element has no size
			var w = document.createElement('div'); 
			_util.css(w, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			w.appendChild(inner);
			// wrapper
			var e = document.createElement('div');
			_util.css(e, {
				position: "fixed",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events" : "none",
				"font-size": _fontSize
			});
			e.style.zIndex = _zIndex;
			e.appendChild(w);
			return e;
		},
	};


	//  internal indicator class
	var Indicator = function (Scene, options) {
		var
			Indicator = this,
			_controller,
			_vertical,
			_flowContainer,
			_triggerGroup,		// the trigger group appropriate for this scene
			_elemBounds = TPL.bounds(),
			_elemStart = TPL.start(options.colorStart),
			_elemEnd = TPL.end(options.colorEnd);

		options.name = options.name || _autoindex;
		
		// make publicly available for trigger update
		Indicator.indent = options.indent; 
		Indicator.name = options.name; 

		_elemStart.firstChild.textContent += " " + options.name;
		_elemEnd.textContent += " " + options.name;

		_elemBounds.appendChild(_elemStart);
		_elemBounds.appendChild(_elemEnd);

		this.add = function () {
			_controller = Scene.controller();
			_vertical = _controller.info("vertical");

			var
				container = _controller.info('container'),
				isDocument = _controller.info('isDocument');

			_flowContainer = options.parent && _util.get.elements(options.parent);
			if (!_flowContainer) {
				// no parent supplied or doesnt exist
				_flowContainer = isDocument ? document.body : container; // check if window/document (then use body)
				// TODO: find closest single movable child (iScroll)
			}
			
			if (!isDocument && _util.css(_flowContainer, "position") === 'static') {// positioning needed for correct display of indicators
				// TODO: test if needed
				_util.css(_flowContainer, {position: "relative"});
			}

			// INIT UPDATES AND DEFINE CALLBACKS
			/*
				needed updates:
				+++++++++++++++
				start/end position on scene shift
				bounds position on container scroll or resize (to keep alignment to bottom/right)
				trigger parameters on triggerHook value change
				trigger position, after adding new, on container resize, window resize (if not equal to container), window scroll (if not equal to container)
			*/

			if (!_controller._triggerGroups) {
				_controller._triggerGroups = [];
				// add listener to update all related trigger groups
				container.addEventListener("resize", handleTriggerPositionChange);
				if (!_controller.info("isDocument")) {
					// also on window scroll and resize
					window.addEventListener("resize", handleTriggerPositionChange);
					window.addEventListener("scroll", handleTriggerPositionChange);
				}
			}
			if (!_controller._boundContainers) {
				_controller._boundContainers = [];
				container.addEventListener("scroll", handleBoundsPositionChange);
				container.addEventListener("resize", handleBoundsPositionChange);
			}

			Scene.on("change.debug", function (e) { // when value actually changes
				if (e.what === "triggerHook") {
					updateTriggerGroup();
				}
			});
			updateTriggerGroup(); // trigger elements are automatically added here, if needed.

			addBounds(); // Add Bounds elements (start/end)
			Scene.on("shift.debug", updateBounds); // when values actually change
			updateBounds();
			setTimeout(function () {
				updateBoundsPositions(_elemBounds);
			}, 0); // do after all execution is finished otherwise sometimes size calculations are off


			Scene._log(3, "added indicators");
		};

		this.remove = function () { // TODO: unset, remove and reverse all the stuff
			_controller = undefined;
			Scene._log(3, "removed indicators");
		};

		var addBounds = function () {
			// add bounds elements
			_flowContainer.appendChild(_elemBounds);
			
			_util.css(_elemStart.firstChild, {
				"border-bottom-width" : _vertical ? 1 : 0,
				"border-right-width" :	_vertical ? 0 : 1,
				"bottom":								_vertical ? -1 : options.indent,
				"right":								_vertical ? options.indent : -1,
				"padding":							_vertical ? "0 8px" : "2px 4px",
			});
			_util.css(_elemEnd, {
				"border-top-width" :		_vertical ? 1 : 0,
				"border-left-width" : 	_vertical ? 0 : 1,
				"top":									_vertical ? "100%" : "",
				"right":								_vertical ? options.indent : "",
				"bottom":								_vertical ? "" : options.indent,
				"left":									_vertical ? "" : "100%",
				"padding":							_vertical ? "0 8px" : "2px 4px"
			});
			if (_vertical) {
				var alignCSS = {
					"text-align" : "center",
					"min-width" : 30,
				};
				_util.css(_elemStart.firstChild, alignCSS);
				_util.css(_elemEnd, alignCSS);
			}
			_controller._boundContainers.push(_elemBounds);
		};

		// event handler for when associated trigger groups need to be updated
		var handleTriggerPositionChange = function () {
			updateTriggerGroupPositions();
		};

		// event handler for when associated bounds markers need to be updated
		var handleBoundsPositionChange = function () {
			updateBoundsPositions();
		};

		// updates the positions of all trigger groups attached to this controller or a specific one, if provided
		var updateTriggerGroupPositions = function (specificGroup) {
			var // constant vars
				groups = specificGroup ? [specificGroup] : _controller._triggerGroups,
				i = groups.length,
				info = _controller.info(),
				flowContainer = info.isDocument ? document.body : info.container,
				containerOffset = _util.get.offset(flowContainer, !info.isDocument),
				edge = _vertical ?
							 Math.min(_util.get.width(flowContainer), _util.get.width(info.container)) - _edgeOffset :
							 Math.min(_util.get.height(flowContainer), _util.get.height(info.container)) - _edgeOffset;
			var // changing vars
					group,
					elem,
					pos,
					elemSize,
					transform;
			while (i--) {
				group = groups[i];
				elem = group.element;
				pos = group.triggerHook * info.size;
				elemSize = _vertical ? _util.get.height(elem.firstChild.firstChild) : _util.get.width(elem.firstChild.firstChild);
				transform = pos > elemSize ? "translate" + (_vertical ? "Y" : "X") + "(-100%)" : "";

				_util.css(elem, {
					top: containerOffset.top + (_vertical ? pos : edge - group.members[0].indent),
					left: containerOffset.left + (_vertical ? edge - group.members[0].indent : pos)
				});
				_util.css(elem.firstChild.firstChild, {
					"-ms-transform" : transform,
					"-webkit-transform" : transform,
					"transform" : transform
				});
			}
		};

		// update the start and end positions of the scene
		var updateBounds = function () {
			var css = {};
			css[_vertical ? "top" : "left"] = Scene.triggerPosition();
			css[_vertical ? "height" : "width"] = Scene.duration();
			_util.css(_elemBounds, css);
			_util.css(_elemEnd, {
				display: Scene.duration() > 0 ? "" : "none"
			});
		};

		// updates the position of the bounds container to aligned to the right for vertical containers and to the bottom for horizontal
		var updateBoundsPositions = function (specificBounds) {
			var // constant for all bounds
				bounds = specificBounds ? [specificBounds] : _controller._boundContainers,
				i = bounds.length,
				css = {},
				container = _controller.info("container"),
				edge = _vertical ?
							_util.get.scrollLeft(container) + Math.min(_util.get.width(_flowContainer), _util.get.width(container)) - _util.get.width(_triggerGroup.element.firstChild) - _edgeOffset:
							_util.get.scrollTop(container) + Math.min(_util.get.height(_flowContainer), _util.get.height(container)) - _util.get.height(_triggerGroup.element.firstChild) - _edgeOffset;
			css[_vertical ? "left" : "top"] = edge;
			while (i--) {
				_util.css(bounds[i], css);
			}
		};

		var addTriggerGroup = function () {
			var triggerElem = TPL.trigger(options.colorTrigger); // new trigger element
			var css = {};
			css[_vertical ? "right" : "bottom"] = 0;
			css[_vertical ? "border-top-width" : "border-left-width"] = 1;
			_util.css(triggerElem.firstChild, css);
			_util.css(triggerElem.firstChild.firstChild, {
				padding: _vertical ? "0 8px 3px 8px" : "3px 4px"
			});
			document.body.appendChild(triggerElem); // directly add to body
			_triggerGroup = {
				triggerHook: Scene.triggerHook(),
				element: triggerElem,
				members: [Indicator]
			};
			_controller._triggerGroups.push(_triggerGroup);
			// update right away
			updateTriggerGroupPositions(_triggerGroup);
			updateTriggerGroupLabel(_triggerGroup);
		};

		var removeTriggerGroup = function () {
			_controller._triggerGroups.splice(_controller._triggerGroups.indexOf(_triggerGroup), 1);
			_triggerGroup.element.parentNode.removeChild(_triggerGroup.element);
			_triggerGroup = undefined;
		};

		// add indicator to a trigger group.
		// Logic:
		// 1 checks if current trigger group is in sync with Scene settings if so, nothing else needs to happen
		// 2 try to find an existing one that matches parameters
		// 	 2.1 If a match is found check if already assigned to an existing group
		//       A: was the last member of existing group -> kill whole group
		//       B: existing group has other members -> just remove from member list
		//	 2.2 Assign to matching group
		// 3 if no new match could be found check if assigned to existing groupp
		//   A: yes, and it's the only member -> just update parameters and positions and keep using this group
		//   B: yes but there are other members -> remove from member list and create a new one
		//   C: no, so create a new one
		var updateTriggerGroup = function () {
			var
				triggerHook = Scene.triggerHook(),
				closeEnough = 0.0001;

			// Have a group, check if it still matches
			if (_triggerGroup) {
				if (Math.abs(_triggerGroup.triggerHook - triggerHook) < closeEnough) {
					// _util.log(0, "trigger", options.name, "->", "no need to change, still in sync");
					// all good
					return;
				}
				// _util.log(0, "trigger", options.name, "->", "out of sync!");
			}
			// Don't have a group, check if a matching one exists
			var
				groups = _controller._triggerGroups,
				group,
				i = groups.length;
			while (i--) {
				group = groups[i];
				if (Math.abs(group.triggerHook - triggerHook) < closeEnough) {
					// found a match!
					// _util.log(0, "trigger", options.name, "->", "found match");
					if (_triggerGroup) { // do I have an old group that is out of sync?
						if (_triggerGroup.members.length === 1) { // is it the only remaining group?
							// _util.log(0, "trigger", options.name, "->", "kill");
							// was the last member, remove the whole group
							removeTriggerGroup();
						} else {
							_triggerGroup.members.splice(_triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
							updateTriggerGroupPositions(_triggerGroup);
							updateTriggerGroupLabel(_triggerGroup);
							// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
						}
					}
					// join new group
					group.members.push(Indicator);
					_triggerGroup = group;
					updateTriggerGroupLabel(group);
					return;
				}
			}

			// at this point I am obviously out of sync and don't match any other group
			if (_triggerGroup) {
				if (_triggerGroup.members.length === 1) {
					// _util.log(0, "trigger", options.name, "->", "updating existing");
					// out of sync but i'm the only member => just change and update
					_triggerGroup.triggerHook = triggerHook;
					updateTriggerGroupPositions(_triggerGroup);
					return;
				} else {
					// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
					_triggerGroup.members.splice(_triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
					updateTriggerGroupPositions(_triggerGroup);
					updateTriggerGroupLabel(_triggerGroup);
					_triggerGroup = undefined; // need a brand new group...
				}
			}
			// _util.log(0, "trigger", options.name, "->", "add a new one");
			// did not find any match, make new trigger group
			addTriggerGroup();
		};

	};

}));