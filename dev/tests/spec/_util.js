	// test scroll top calculations
	// function test () {
	// 	console.log("window explicit ->", $(window).scrollTop() === scrollTop(window));
	// 	console.log("window implicit ->", $(window).scrollTop() === scrollTop());
	// 	console.log("element ->", $("#container1").scrollTop() === scrollTop($("#container1")[0]));
	// 	console.log("document ->", $(document).scrollTop() === scrollTop(document));
	// 	console.log("body ->", $("body").scrollTop() === scrollTop(document.body));
	// }

define(["ScrollMagic"], function (ScrollMagic) {
	describe('ScrollMagic._util', function() {
		var U = ScrollMagic._util;
		it('should not fire .log() when instanciating scene or controller with loglevel 2', function () {
			spyOn(U, "log");
			new ScrollMagic.Controller({loglevel: 2});
			new ScrollMagic.Scene({loglevel: 2});
			expect(U.log).not.toHaveBeenCalled();
		});
	});
});