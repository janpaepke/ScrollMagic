// SETTINGS
var
	MENU = {
		"basic": {
			title: "Basic",
			sub: {
				"simple_tweening.html" :	"Simple Tweening",
				"simple_pinning.html" :		"Simple Pinning",
				"going_horizontal.html" :	"Going Horizontal",
				"debugging.html" :			"Debugging",
				"custom_actions.html" :		"Custom Actions",
				"scene_manipulation.html" :	"Scene Manipulation",
			}
		},
		"advanced": {
			title: "Advanced",
			sub: {
				"advanced_tweening.html" :		"Advanced Tweening",
				"custom_containers.html" :		"Custom Containers",
				"mobile_basic.html" :			"Mobile Support (Basic)",
				"anchor_link_scrolling.html" :	"Anchor Link Scrolling",
				"parallax_scrolling.html" :		"Parallax Scrolling",
				"infinite_scrolling.html" :		"Infinite Scrolling"
			}
		},
		"expert": {
			title: "Expert",
			sub: {
				"cascading_pins.html" :				"Cascading Pins",
				"responsive_duration.html" :		"Responsive Duration",
				"manipulating_tweens.html" :		"Manipulating Tweens",
				"multiple_scroll_directions.html" :	"Multiple Scroll Directions",
				"mobile_advanced.html" :			"Mobile Support (Advanced)",
				"removing_and_destroying.html" :	"Removing and Destroying",
			}
		}
	};


// vars

var
	path = window.location.pathname.split("/"),
	isRoot = (path.length <= 1 || MENU[path[path.length-2]] == undefined);

// functions

function getCode($elem) {
	var
		source = $($elem)
				  .clone()
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

	return {
		source: lines.join("\n"),
		linenumbers: linenumbers
	}
}

function showCode ($elem) {
	var
		code = getCode($elem);
	
	if ($elem.is("section.demo")) {
		// complicated but i want to keep identation.
		var $desc = $("div#example-wrapper section#titlechart").clone();
		$desc.find(":not(script)").remove();
		if ($desc.children().length > 0) {
			var startcode = getCode($desc);
			code.linenumbers = startcode.linenumbers + "᎒" + code.linenumbers;
			code.source = startcode.source + "᎒" + code.source;
		}
	}

	// insert
	var $code = 	$("<div>")
					.addClass("code")
					.addClass("doselect")
					.text(code.source)
					.wrapInner("<pre>"),
		$ln =		$("<div>")
					.addClass("linenumbers")
					.addClass("noselect")
					.html(code.linenumbers)
					.wrapInner("<pre>"),
		$close = 	$("<div>")
					.attr("id", "close")
					.addClass("button"),
		$select =	$("<div>")
					.attr("id", "select")
					.addClass("button")
					.text("select all"),
		$codewrap = $("<div>")
					.addClass("codewrap")
					.append($ln)
					.append($code);
	
	$("<div>")
		.attr("id", "codecontainer")
		.append($codewrap)
		.append($close)
		.append($select)
		.appendTo("body");

	// avoid selecting parts of document, when selecting code.
	$("html").css("user-select", "none");
	disableScroll();

	// highlight
	hljs.highlightBlock($code.get(0));

	$code.html($code.html().replace("᎒", '<div class="break noselect"> </div>'));
	$ln.html($ln.html().replace("᎒", '<div class="break noselect"></div>'));
}

function hideCode() {
	$("body > div#codecontainer").remove();
	$("html").css("user-select", "");
	enableScroll();
}

function selectCode() {
	var $code = $("body > div#codecontainer .code");
	if ($code[0]) {
		if (document.selection) {
			var range = document.body.createTextRange();
			range.moveToElementText($code[0]);
			range.select();
		} else if (window.getSelection) {
			var range = document.createRange();
			range.selectNode($code[0]);
			window.getSelection().addRange(range);
		}
	}
}

function disableScroll (elem) {
	if (elem === undefined) elem = window;
	var
		$node = document.ownerDocument ? $(elem) : $("body");
		pos = {
			x : $(elem).scrollLeft(),
			y : $(elem).scrollTop()
		};
	$node.css("overflow", "hidden");
	$(elem).on("scroll.PREVENT", function (e) {
		$(elem).scrollLeft(pos.x);
		$(elem).scrollTop(pos.y);
		e.stopPropagation();
	});
}

function enableScroll (elem) {
	if (elem === undefined) elem = window;
	var $node = document.ownerDocument ? $(elem) : $("body");
	$node.css("overflow", "");
	$(elem).off("scroll.PREVENT");
}

$(document).ready(function () {
	// prepare highlight js
	

	// build menu
	var $menu = $("ul#menu");
	if ($menu.length > 0) {
		$.each(MENU, function (key, value) {
			var
				path = isRoot ? key : "../" + key;
				$li = $("<li>").appendTo($menu),
				$a = $("<a href='" + path + "'>" + value.title + "</a>").appendTo($li),
				$ul_sub = $("<ul>").appendTo($li);
			$.each(value.sub, function (key, value) {
				var
					$li = $("<li>").appendTo($ul_sub),
					$a = $("<a href='" + path + "/" + key + "'>" + value + "</a>").appendTo($li)
			})
		});

		if ($menu.parent().is("body")) {
			var
				$flag = $("<div>Menu</div>")
							.addClass("flag");
				$menuwrap = $("<div>")
							.addClass("menuwrap")
							.prependTo("body")
							.before($menu)
							.append($menu)
							.append($flag);

			$(document).on("touchstart", ".menuwrap", function (e) {
				$menuwrap.addClass("open");
				e.stopPropagation();
			});
			$(document).on("touchstart", ":not(.menuwrap)", function (e) {
				$menuwrap.removeClass("open");
			});
		}
		$(document).on("touchstart", "ul#menu li", function (e) {
			$("ul#menu li").removeClass("open");
			var $parent = $(e.target).parents("ul#menu li");
			if ($parent.length > 0) {
				$parent.addClass("open");
				e.stopPropagation();
			}
		});
	}

	// store initial HTML of code
	$("a.viewsource").each(function () {
		var $parent = $(this).parents(".demowrap, section.demo:not(.demowrap .demo), div#example-wrapper, body").first().clone();
		$(this).data("code", $parent.clone());
	})

	// build sliders
	$("div.slider+input")
		.prop("disabled", true)
		.on("change", function () {
			$(this).prev().find(".handle").css("left", Math.round(($(this).val() - parseFloat($(this).attr("min"))) / (parseFloat($(this).attr("max")) - parseFloat($(this).attr("min"))) * 100) + "%");
		})
		.prev()
			.append("<div class=\"trackbar\"></div>")
			.append("<div class=\"handle\"></div>")


});

// event listener
$(document).on("click", "ul#menu > li > a", function (e) {
	e.preventDefault();
});

$(document).on("click", "a.viewsource", function (e) {
	e.preventDefault();
	showCode($(this).data("code"));
});

$(document).on("click", "#codecontainer #close.button", hideCode);
$(document).on("click", "#codecontainer #select.button", selectCode);
$(document).on("keydown", function (e) {
	if (e.which == 27) {
		e.preventDefault();
		hideCode();
	}
});

// dragables / slider
$(document).on("mousedown", ".slider, .move", function (e) {
	var $this = $(this);
	if ($this.is(".slider") || e.target == this) { // only the element itself,  not the children, unless its the slider
		e.stopPropagation();
		var
			offset = $this.offset(),
			drag = {top: offset.top - $(document).scrollTop(), left: offset.left - $(document).scrollLeft()};
		if ($this.is(".move")) {
			drag.top -= e.pageY;
			drag.left -= e.pageX;
		}
		$this.data("drag", drag);
		$this.addClass("dragging");
		$("html").addClass("noselect");
	}
});

$(document).on("mouseup mousemove", function (e) {
	$(".move.dragging").each(function (f) {
		var data = $(this).data("drag");
		if (data) {
			$(this).css({
				top:  data.top + e.pageY,
				left: data.left + e.pageX
			});
		}
	})
	$(".slider.dragging").each(function (f) {
		var data = $(this).data("drag");
		if (data) {
			var
				pos = e.pageX - data.left,
				width = $(this).width(),
				$input = $(this).next("input"),
				min = parseFloat($input.attr("min")) || 0,
				max = parseFloat($input.attr("max")) || width,
				step = 1/parseFloat($input.attr("step")) || 1;
			if (pos <= 0) {
				pos = 0;
			}
			if (pos >= width) {
				pos = width;
			}
			var
				perc = pos/width,
				val = (max-min) * perc + min,
				decimals = Math.log(step) / Math.LN10;
			// mind the step
			val = Math.round(val*step)/step;
			$(this).find(".handle").css("left", pos);

			$input.val(val.toFixed(decimals));
			if ($(this).hasClass("liveupdate")) {
				$input.change();	
			}
		}
	})
});

$(document).on("mouseup", function (e) {
	$(".slider.dragging + input").change(); // trigger change
	$(".move.dragging, .slider.dragging")
		.data("drag", null)
		.removeClass("dragging");
	$("html").removeClass("noselect");
});

$(document).on("orientationchange", function (e) {
	if ($("#example-wrapper.horizontal").length > 0) {
		$("meta[name='viewport']").attr("content", (window.orientation == 0 ? "width" : "height")+ "=500");
	}
});
$(document).trigger("orientationchange");



