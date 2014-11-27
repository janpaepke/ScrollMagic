	/**
	 * Scene destroy event.  
	 * Fires whenvever the scene is destroyed.
	 * This can be used to tidy up custom behaviour used in events.
	 *
	 * @class
	 * @global
	 * @since 1.1.0
	 *
	 * @example
	 * scene.on("enter", function (event) {
	 *        // add custom action
	 *        $("#my-elem").left("200");
	 *      })
	 *      .on("destroy", function (event) {
	 *        // reset my element to start position
	 *        if (event.reset) {
	 *          $("#my-elem").left("0");
	 *        }
	 *      });
	 *
	 * @property {object} event - The event Object passed to each callback
	 * @property {string} event.type - The name of the event
	 * @property {Scene} event.target - The Scene object that triggered this event
	 * @property {boolean} event.reset - Indicates if the destroy method was called with reset `true` or `false`.
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