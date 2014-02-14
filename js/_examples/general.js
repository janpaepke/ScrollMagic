// SETTINGS
var
	MENU = {
		"basic": {
			title: "Basic",
			sub: {
				"simple_tweening.html" :	"Simple Tweening",
				"simple_pinning.html" :		"Simple Pinning",
				"going_vertical.html" :		"Going vertical",
				"settings.html" :			"Settings",
				"debugging.html" :			"Debugging"
			}
		},
		"advanced": {
			title: "Advanced",
			sub: {
				"advanced_technology.html" :	"Advanced Tweening",
				"parallax.html" :				"Parallax",
				"container.html" :				"Container",
				"mobile_advanced.html" :		"Mobile (Basic)",
				"custom_actions.html" :			"Custom Actions",
				"unlimited_scroll.html" :		"Unlimited Scroll"
			}
		},
		"expert": {
			title: "Expert",
			sub: {
				"cascading_pins.html" :				"Cascading Pins",
				"responsive_duration.html" :		"Responsive Duration",
				"manipulating_tweens.html" :		"Manipulating Tweens",
				"multiple_scroll_directions.html" :	"Multiple Scroll Directions",
				"mobile_advanced.html" :			"Mobile (Advanced)",
				"removing_and_destroying.html" :	"Removing and Destroying",
			}
		}
	};


// vars

var
	path = window.location.pathname.split("/"),
	isRoot = (path.length <= 1 || MENU[path[path.length-2]] == undefined);

// functions

function showCode ($which) {
	var
		source = $($which)
				  .clone()
				  // .find("section#titlechart")
						// .remove()
						// .end()
				  .html(),
		lines = source.split("\n"),
		linenumbers = "";


	// kill empty lines at start/end
	while (lines.length > 0 && $.trim(lines[0]) == "") {
		lines.shift();
	}
	while (lines.length > 0 && $.trim(lines[lines.length - 1]) == "") {
		lines.pop();
	}

	// make linenumbers
	for (var i = 1; i <= lines.length; i++) {
		linenumbers += i + "\n";
	}

	// normalize base indentation
	var tabAtStart = /^\t/g;
	while (lines[0].search(tabAtStart) > -1) {
		$.each(lines, function (index, value) {
			lines[index] = value.replace(tabAtStart, "");
		});
	}

	source = lines.join("\n");

	// insert
	var $code = 	$("<div></div>")
					.addClass("code")
					.text(source)
					.wrapInner("<pre></pre>"),
		$ln =		$("<div></div>")
					.addClass("linenumbers")
					.html(linenumbers)
					.wrapInner("<pre></pre>"),
		$close = 	$("<div></div>")
					.attr("id", "closebutton");
	
	$("<div></div>")
		.attr("id", "codecontainer")
		.append($ln)
		.append($code)
		.append($close)
		.appendTo("body");
	
	$("body").css("overflow", "hidden"); // set overflow to hidden to avoid scrolling body while open.
	
	// highlight
	hljs.highlightBlock($code.get(0), "    ");
}

function hideCode() {
	$("body > div#codecontainer").remove();
	$("body").css("overflow", "");
}

console.log();

$(document).ready(function () {
	// prepare highlight js
	

	// build menu
	var $menu = $("ul#menu");
	if ($menu.length > 0) {
		$.each(MENU, function (key, value) {
			var
				path = isRoot ? key : "../" + key;
				$li = $("<li></li>").appendTo($menu),
				$a = $("<a href='" + path + "'>" + value.title + "</a>").appendTo($li),
				$ul_sub = $("<ul></ul>").appendTo($li);
			$.each(value.sub, function (key, value) {
				var
					$li = $("<li></li>").appendTo($ul_sub),
					$a = $("<a href='" + path + "/" + key + "'>" + value + "</a>").appendTo($li)
			})
		});

		if ($menu.parent().is("body")) {
			var
				$flag = $("<div>Menu</div>");
				$menuwrap = $("<div></div>")
							.addClass("menuwrap")
							.prependTo("body")
							.before($menu)
							.append($menu)
							.append($flag);
		}
	}

});

// event listener
$(document).on("click", "ul#menu > li > a", function (e) {
	e.preventDefault();
});

$(document).on("click", "a.viewsource", function (e) {
	e.preventDefault();
	showCode($("#example-wrapper"));
});

$(document).on("click", "#codecontainer #closebutton", function (e) {
	hideCode();
});

