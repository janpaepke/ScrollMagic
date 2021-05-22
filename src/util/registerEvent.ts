/**
 * Adds the passed listener as an event listener to the passed event target, and returns a function which reverses the
 * effect of this function.
 * @param {*} target object the listener should be attached to
 * @param {*} type type of listener
 * @param {*} listener callback
 * @param {*} options Event listener options
 */
export const registerEvent = (
	target: GlobalEventHandlers,
	type: keyof (GlobalEventHandlersEventMap & WindowEventMap), // this does not catch if the wrong event is used on the wrong target, but should be stricter than 'string'
	listener: EventListenerOrEventListenerObject,
	options?: boolean | AddEventListenerOptions
): (() => void) => {
	target.addEventListener(type, listener, options);
	return target.removeEventListener.bind(target, type, listener, options);
};
