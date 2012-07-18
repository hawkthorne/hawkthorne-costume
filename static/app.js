var $newhotness, $oldbusted, $character, $costume_btn, $background_btn,
	$costume, $url, $artboard, $highlighter, $canvas, $zoom_slide, $zoom_size;

var big_image = false;

$(document).ready(function() {
	var baseUrl = 'https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/images/';

	// jQuery vars
	$newhotness = $('#newhotness'),
	$oldbusted = $("#oldbusted"),
	$character = $('#character'),
	$costume_btn = $('#toolbar .costume'),
	$background_btn = $('#toolbar .bg'),
	$costume = $('#costume'),
	$url = $('#url'),
	$artboard = $('#artboard'),
	$highlighter = $('#artboard .highlighter'),
	$play = $('#inspector_spacetime .play'),
	$canvas = $('#canvas'),
	$zoom_slide = $('#zoom_slide')
	$zoom_size = $('.zoom_size');

	$character.change(function(e) {
		updateOriginal($(this).val());
		updateUrl();
	});

	$costume_btn.click(function(e) {
		e.preventDefault();
		$newhotness.toggle();
		$oldbusted.toggle();
	});

	var bgtoggle = 0;

	$background_btn.click(function(e) {
		e.preventDefault();
		bgtoggle++;
		$artboard.css('background', bgtoggle % 2 ? '#34c429' : '');
		$canvas.css('background', bgtoggle % 2 ? '#34c429' : '');
	});

	$costume.submit(function(e) {
		e.preventDefault();
	})

	$url.on('change', function(e) {
		updateCostume($(this).val());
		updateUrl();
	});

	$artboard.mousemove(function(e) {
		$highlighter.show();
		var loc = get_square_coords(e)
		$highlighter.css( {
			left: loc.X * 48,
			top: loc.Y * 48
		} );
	});

	$artboard.mouseout(function() {
		$highlighter.hide();
	});

	$artboard.click(function(e) {
		if( big_image !== false ) {
			var loc = get_square_coords(e);
			render_image( big_image, loc.X, loc.Y );
		}
	});

	$zoom_slide.change(function() {
		z = $zoom_slide.val();
		$canvas.css({
			"width": ( z * 48 ) + "px",
			"height": ( z * 48 ) + "px"
		});
		$zoom_size.html('x' + z);
	});

	$play.click(function() {
		var queue = [];
		for( var y = 0; y <= 15; y++ ) {
			for( var x = 0; x <= 8; x++ ) {
				queue.push( { img: big_image, x: x, y: y } );
			}
		}
		function play_next() {
			console.log( 'play_next', queue.length );
			if( queue.length ) {
				var o = queue.shift();
				$highlighter.show();
				$highlighter.css( {
					left: o.x * 48,
					top: o.y * 48
				} );
				render_image( o.img, o.x, o.y );
				setTimeout( play_next, 100 );
			} else {
				$highlighter.hide();
			}
		}
		play_next();
	});

	show_spinner( $canvas[0] );
	var img = new Image();
	img.onload = function() {
		big_image = img;
		clear_canvas( $canvas[0] );
	};
	img.src = '/big/' + encodeURIComponent( $newhotness.attr('src') );

	window.onpopstate = function(event) {
		if (event.state) {
			$url.val(event.state.costume);
			$character.val(event.state.character);

			updateCostume(event.state.costume);
			updateOriginal(event.state.character);
		}

	};

});

function updateUrl() {
	if (window.history && history.pushState) {
		var character = $character.val();
		var costume = $url.val();

		var data = ({
			character: character,
			costume: costume
		});

		var url = "/" + character;

		if (costume) {
			url = url + "/" + encodeURIComponent(costume);
		}

		history.replaceState(data, window.title, url);
	}
}

function updateCostume(url) {
	if (url) {
		$newhotness
			.attr('src', url)
			.show();
		$oldbusted.hide();
	} else {
		$newhotness
			.hide()
			.attr('src', '');
		$oldbusted.show();
	}
}

function updateOriginal(character) {
	var imgUrl = baseUrl + character + ".png";
	$oldbusted.attr('src', imgUrl);
}

function get_square_coords( e ) {
	return {
		Y: Math.floor(e.offsetY / 48),
		X: Math.floor(e.offsetX / 48)
	};
}

function show_spinner( c ) {
	console.log(c);
	var cog = new Image();
	function init() {
		cog.src = '/static/loading.png'; // Set source path
		c.spinInterval = setInterval(draw,10);
	}
	var rotation = 0;
	function draw() {
		var h = c.height,
			w = c.width,
			ctx = c.getContext('2d');
		ctx.globalCompositeOperation = 'destination-over';
		ctx.save();
		ctx.clearRect(0,0,h,w);
		ctx.translate(h / 2, w / 2); // to get it in the origin
		rotation +=1;
		ctx.rotate(rotation*Math.PI/64); //rotate in origin
		ctx.translate( ( h / 2 ) * -1, ( w / 2 ) * -1 ); //put it back
		ctx.drawImage(cog,h / 4, w / 4,h / 2, w / 2);
		ctx.restore();
	}
	init();
};

function clear_canvas( c ) {
	var h = c.height,
		w = c.width,
		ctx = c.getContext('2d');
	if( c.spinInterval ) {
		clearInterval( c.spinInterval );
		delete c.spinInterval;
	}
	ctx.clearRect(0,0,h,w);
}

function render_image( img, x, y ) {
	var c = $canvas[0],
		ctx = c.getContext('2d');
	ctx.clearRect( 0, 0, c.width, c.height );
	ctx.drawImage(
		img, // image
		x * 480, // source offset X ( left )
		y * 480,// source offset Y ( top )
		480, // source width
		480, // source height
		0, // destination offset X ( left )
		0, // destination offset Y ( top )
		c.width, // destination width
		c.height // destination height
	);
}
