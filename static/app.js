var $newhotness, $oldbusted, $character, $bg,
	$costume, $url, $artboard, $highlighter, $play_buttons,
	$canvas, c, $zoom_slide, $zoom_size, $char_opacity, $char_opacity_size;

var image = {};
	image.character = false;
	image.costume = false;

$(document).ready(function() {
	var baseUrl = 'https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/images/';

	// jQuery vars
	$newhotness = $('#newhotness'),
	$oldbusted = $("#oldbusted"),
	$character = $('#character'),
	$bg = $('#bg'),
	$costume = $('#costume'),
	$url = $('#url'),
	$artboard = $('#artboard'),
	$highlighter = $('#artboard .highlighter'),
	$play_buttons = $('#inspector_spacetime .play button'),
	$stop = $('#inspector_spacetime .stop'),
	$canvas = $('#canvas'),
	$zoom_slide = $('#zoom_slide')
	$zoom_size = $('.zoom_size');
	$char_opacity = $('#char_opacity');
	$char_opacity_size = $('.char_opacity_size');

	c = $canvas[0];
	c._face = 'left';
	c._dir = false;
	c._mouse = false;

	var fps = 10;
	setInterval(function() {
		update();
		draw();
	}, 1000 / fps );

	// animation queue
	c.queue = [];

	$character.change(function(e) {
		updateOriginal($(this).val());
	});

	$bg.change(function(e) {
		var state = $bg.prop('checked');
		$artboard.css('background', state ? '#34c429' : '');
		$canvas.css('background', state ? '#34c429' : '');
	});

	$costume.submit(function(e) {
		e.preventDefault();
	})

	$url.on('change', function(e) {
		$costume.submit();
	});

	$artboard.mousemove(function(e) {
		if( c._mouse != 'lock' ) {
			c._mouse = true;
			var loc = get_square_coords(e);
			c.queue = [ [ loc.X, loc.Y ] ];
			$artboard.attr('title','[ ' + loc.X + ', ' + loc.Y + ' ]');
		}
	});

	$artboard.click(function(e) {
		if( c._mouse != 'lock' ) c._mouse = 'lock';
		else c._mouse = true;
	});

	$zoom_slide.change(function() {
		z = $zoom_slide.val();
		$canvas.css({
			"width": ( z * 48 ) + "px",
			"height": ( z * 48 ) + "px"
		});
		$zoom_size.html('x' + z);
	});

	$char_opacity.change(function() {
		z = $char_opacity.val();
		$char_opacity_size.html(z + '%');
	});

	$play_buttons.click(function() {
		var action = this.id;
		c._mouse = false;
		if( action == 'play_all' ) {
			for( var y = 0; y <= 14; y++ ) {
				for( var x = 0; x <= 8; x++ ) {
					c.queue.push( [ x, y ] );
				}
			}
		} else if( action == 'stop' ) {
			c.queue = [];
		} else if( action == 'spin' ) {
			var s = motion.other.spin;
			c.queue = [].concat(s,s,s,s,s);
		}
	});

	init_canvas();

	$(document).bind('keydown', 'left', start_running );
	$(document).bind('keyup', 'left', stop_running );
	$(document).bind('keydown', 'right', start_running );
	$(document).bind('keyup', 'right', stop_running );
	$(document).bind('keydown', 'up', start_running );
	$(document).bind('keyup', 'up', stop_running );
	$(document).bind('keydown', 'down', start_running );
	$(document).bind('keyup', 'down', stop_running );

});

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

function render_image( _arr ) {
	if( image.costume ) {
		var ctx = c.getContext('2d');
		ctx.clearRect( 0, 0, c.width, c.height );
		ctx.drawImage(
			image.costume, // image
			_arr[0] * 480, // source offset X ( left )
			_arr[1] * 480,// source offset Y ( top )
			480, // source width
			480, // source height
			0, // destination offset X ( left )
			0, // destination offset Y ( top )
			c.width, // destination width
			c.height // destination height
		);
	}
}

function update() {
	// handles all inspector movement
	if( !c._mouse ) {
		if( c._dir !== false ) {
			c.queue.push( motion.run[ c._dir ][ c[ c._dir ]++ % motion.run[ c._dir ].length ] );
		} else {
			c.queue = [ motion.stop[ c._face ] ];
		}
	}
}

function draw() {
	if( c._mouse == 'lock' ) $highlighter.css({background: '#f00'});
	else $highlighter.css({background: ''});
	if( c.queue.length ) {
		var o = c.queue.shift();
		$highlighter.show();
		$highlighter.css( {
			left: o[0] * 48,
			top: o[1] * 48
		} );
		render_image( o );
	}
}

function init_canvas() {
	show_spinner( c );
	var img = new Image();
	img.onload = function() {
		image.costume = img;
		clear_canvas( c );
		render_image( [ 0, 0 ] );
	};
	img.src = '/big/' + encodeURIComponent( $newhotness.attr('src') );
}

function start_running( e ) {
	e.preventDefault();
	if( c._dir != e.data ) {
		c._mouse = false;
		c._dir = e.data;
		c[ e.data ] = 0;
	}
}
function stop_running( e ) {
	e.preventDefault();
	if( c._dir == e.data ) {
		c._dir = false;
		c._face = e.data;
	}
}