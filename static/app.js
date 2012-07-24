var _char = false,
	_animation = false,
	_FPS = 10;

var $form, $newhotness, $oldbusted, $character, $bg,
	$url, $artboard, $highlighter, $play_buttons, $stop,
	$canvas, c, $zoom_slide, $zoom_size, $char_toggle,
	$char_opacity, $char_opacity_size;

var image = {};
	image.character = false;
	image.costume = false;

var _keys = [
	'shift', // hold
	'alt', // walk up / down
	'left', // move
	'right', // move
	'up', // look up / move
	'down', // crouch / move
	'space', // jump
	'x', // die
	'a', // attack
];

$(document).ready(function() {

	// jQuery vars
	$form = $('#form'),
	$newhotness = $('#newhotness').length == 1 ? $('#newhotness') : false,
	$oldbusted = $("#oldbusted"),
	$character = $('#character'),
	$bg = $('#bg'),
	$url = $('#url'),
	$artboard = $('#artboard'),
	$highlighter = $('#artboard .highlighter'),
	$play_buttons = $('#inspector_spacetime .play button'),
	$stop = $('#inspector_spacetime .stop'),
	$canvas = $('#canvas'),
	$zoom_slide = $('#zoom_slide')
	$zoom_size = $('.zoom_size');
	$char_toggle = $('#char');
	$char_opacity = $('#char_opacity');
	$char_opacity_size = $('.char_opacity_size');

	// start loading the character lua asap
	$.getJSON(
		'/lua/' + $character.val(),
		function(data, textStatus, jqXHR) {
			_char = data.data;
			_animation = data.data.animations;
			costumes = _char.costumes;
			costumes.shift();
			for( var i in costumes ) {
				var cost_url = encodeURIComponent( 'https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/' + _char.costumes[i].sheet );
				$('#in_game_costumes').append(
					$('<a href="/' + _char.name + '/' + cost_url + '">' + _char.costumes[i].name + '</a>')
				);
			}
			create_catalogue();
		}
	);

	c = $canvas[0];
	c._face = false;
	c._dir = 'left';
	c._motion = 'stop';
	c._mouse = false;
	c._highlighted = [ 0, 0 ];

	// animation queue
	c._queue = [];

	$artboard.mousemove(function(e) {
		if( c._mouse != 'lock' ) {
			c._mouse = true;
			var loc = get_square_coords(e);
			$highlighter.css( {
				left: loc.X * 48,
				top: loc.Y * 48
			} );
			c._highlighted = [ loc.X, loc.Y ];
			$artboard.attr(
				'title',
				  '[ ' + ( loc.X + 1 ) + ', ' + ( loc.Y + 1 ) + ' ]' + c._catalogue[ loc.X ][ loc.Y ].join('')
			);
		}
	});

	$artboard.mouseout(function() {
		c._mouse = false;
	})

	$artboard.click(function(e) {
		if( c._mouse != 'lock' ) c._mouse = 'lock';
		else c._mouse = true;
	});

	// Inspector controls
	$zoom_slide.change(function() {
		var z = $zoom_slide.val();
		$canvas.css({
			"width": ( z * 48 ) + "px",
			"height": ( z * 48 ) + "px"
		});
		$zoom_size.html('x' + z);
	});

	$bg.change(function(e) {
		var state = $bg.prop('checked');
		$artboard.css('background', state ? '#34c429' : '');
		$canvas.css('background', state ? '#34c429' : '');
	});

	if( !$newhotness ) {
		$char_toggle.prop('checked',true);
	}

	$char_toggle.change(function() {
		$oldbusted.toggle();
	});

	$char_opacity.change(function() {
		var o = $char_opacity.val();
		$char_opacity_size.html( o + '%' );
		$oldbusted.css({'opacity': o / 100});
	});

	$play_buttons.click(function() {
		var action = this.id;
		c._mouse = false;
		c._face = false;
		c._dir = false;
		if( action == 'play_all' ) {
			for_each_tile( function(x,y) {
				c._queue.push( [ x, y ] );
			});
		} else if( action == 'stop' ) {
			c._queue = [];
		}
	});

	init_canvas();

	// reload on change
	$character.change(function(e) { $url.val(''); $form.submit(); });
	$url.change(function(e) { $form.submit(); });

});

function create_catalogue() {
	// create a catalogue of known animation frames
	c._catalogue = [];
	for_each_tile(
		function( x, y ) {
			if( c._catalogue[ x ] == undefined ) c._catalogue[ x ] = [];
			if( c._catalogue[ x ][ y ] == undefined ) c._catalogue[ x ][ y ] = [];
		},
		function() {
			for( var motion in _animation ) {
				for( var direction in _animation[ motion ] ) {
					for( var frame in _animation[ motion ][ direction ][ 1 ] ) {
						var set = _animation[ motion ][ direction ][ 1 ];
						if( set[ frame ] instanceof Array && set[ frame ].length == 2 ) {
							c._catalogue[ set[ frame ][0] ][ set[ frame ][1] ].push( "\n  " + motion + ' : ' + direction + "  " );
						}
					}
				}
			}
		}
	);
}

function for_each_tile( func, done ) {
	(function wait_for_oldbusted() {
		if( $oldbusted.height() > 0 ) {
			y_max = Math.floor($oldbusted.height() / 48);
			x_max = Math.floor($oldbusted.width() / 48);
			for( var y = 0; y <= y_max - 1; y++ ) {
				for( var x = 0; x <= x_max - 1; x++ ) {
					func( x , y );
				}
			}
			if( done instanceof Function ) done();
		} else {
			setTimeout( wait_for_oldbusted, 100 );
		}
	})();
}

function get_square_coords( e ) {
	// firefox fix
	var oe = e.originalEvent,
		x = ( oe.offsetX == undefined ? oe.layerX : oe.offsetX ),
		y = ( oe.offsetY == undefined ? oe.layerY : oe.offsetY );
	return {
		Y: Math.floor( y / 48 ),
		X: Math.floor( x / 48 )
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

function init_canvas() {
	show_spinner( c );

	// load the big version of the character first
	var character = new Image();
	character.onload = function() {
		image.character = character;
		if( !$newhotness ) ready();
	};
	character.src = '/big/' + encodeURIComponent( $oldbusted.attr('src') );

	// load the big version of the costume ( if specified )
	if( $newhotness ) {
		var costume = new Image();
		costume.onload = function() {
			image.costume = costume;
			ready();
		};
		costume.src = '/big/' + encodeURIComponent( $newhotness.attr('src') );
	}

	function ready() {
		if( c.spinInterval ) {
			clearInterval( c.spinInterval );
			delete c.spinInterval;
		}
		var ctx = c.getContext('2d');
		ctx.clearRect(0,0,c.height,c.width);
		render_image( c._highlighted );

		// starts the animation loop
		window.onEachFrame( animation_loop );

	}
}

function update() {
	// handles all inspector movement
	if( c._mouse == false ) {
		// check for key presses
		if( keydown.state ) {
			// simples have to go at the bottom!
			     if( keydown.alt && keydown.up )		{ c._motion = 'gazewalk'; }
			else if( keydown.alt && keydown.down )		{ c._motion = 'crouchwalk'; }
			else if( keydown.a && keydown.space )		{ c._motion = 'attackjump'; }
			else if( keydown.a && keydown.space )		{ c._motion = 'attackjump'; }
			else if( keydown.a && keydown.left )		{ c._motion = 'attackwalk'; }
			else if( keydown.a && keydown.right )		{ c._motion = 'attackwalk'; }
			else if( keydown.shift && keydown.left )	{ c._motion = 'holdwalk'; }
			else if( keydown.shift && keydown.right )	{ c._motion = 'holdwalk'; }
			else if( keydown.up ) 						{ c._motion = 'gaze'; }
			else if( keydown.down ) 					{ c._motion = 'crouch'; }
			else if( keydown.shift ) 					{ c._motion = 'hold'; }
			else if( keydown.space ) 					{ c._motion = 'jump'; }
			else if( keydown.x ) 						{ c._motion = 'dead'; }
			else if( keydown.a ) 						{ c._motion = 'attack'; }
			else if( keydown.left )						{ c._motion = 'walk'; }
			else if( keydown.right )					{ c._motion = 'walk'; }
			else										{ c._motion = 'stop'; }

			// direction
			if( keydown.left ) { c._dir = 'left' }
			else if( keydown.right ) { c._dir = 'right' }
		} else {
			c._face = c._dir;
			c._motion = 'stop';
		}
		// now be somebody!!!
		if( c._motion !== 'stop' ) {
			var _m = _animation[ c._motion ][ c._dir ];
			if( _m ) {
				if( !_m._step ) _m._step = 0;
				c._queue.push( _m[1][ _m._step++ % _m[1].length ] );
			}
		} else if( c._face !== false ) {
			c._queue.push( _animation.idle[ c._face ][1][0] );
		}
	}
	if( c._queue.length > 0 ) {
		var o = c._queue.shift();
		c._next_frame = o;
	} else {
		c._next_frame = c._highlighted;
	}
}

function draw() {
	if( c._mouse == 'lock' ) $highlighter.css({background: '#f00'});
	else $highlighter.css({background: ''});
	if( c._next_frame ) {
		$highlighter.css( {
			left: c._next_frame[0] * 48,
			top: c._next_frame[1] * 48
		} );
		c._highlighted = c._next_frame.slice(0);
		render_image( c._next_frame );
	}
}

function render_image( _pos ) {
	var ctx = c.getContext('2d'),
		cleared = false;
	if( image.character && $char_toggle.prop('checked') ) {
		ctx.clearRect( 0, 0, c.width, c.height ); cleared = true;
		var o = $char_opacity.val();
		ctx.globalAlpha = o / 100;
		ctx.drawImage(
			image.character, // image
			_pos[0] * 480, // source offset X ( left )
			_pos[1] * 480,// source offset Y ( top )
			480, // source width
			480, // source height
			0, // destination offset X ( left )
			0, // destination offset Y ( top )
			c.width, // destination width
			c.height // destination height
		);
	}
	if( image.costume ) {
		if( !cleared ) ctx.clearRect( 0, 0, c.width, c.height );
		ctx.globalAlpha = 1;
		ctx.drawImage(
			image.costume, // image
			_pos[0] * 480, // source offset X ( left )
			_pos[1] * 480,// source offset Y ( top )
			480, // source width
			480, // source height
			0, // destination offset X ( left )
			0, // destination offset Y ( top )
			c.width, // destination width
			c.height // destination height
		);
	}
}

var animation_loop = (function() {
	var loops = 0,
		skipTicks = 1000 / _FPS,
		maxFrameSkip = 10,
		nextGameTick = (new Date).getTime();

	return function() {
		loops = 0;

		while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
			update();
			nextGameTick += skipTicks;
			loops++;
		}

		draw();
	};
})();

// animation loop ( courtesy of http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/index.html )
(function() {
	var onEachFrame;
	if (window.webkitRequestAnimationFrame) {
		onEachFrame = function(cb) {
			var _cb = function() { cb(); webkitRequestAnimationFrame(_cb); }
			_cb();
		};
	} else if (window.mozRequestAnimationFrame) {
		onEachFrame = function(cb) {
			var _cb = function() { cb(); mozRequestAnimationFrame(_cb); }
			_cb();
		};
	} else {
		onEachFrame = function(cb) {
			setInterval( cb, 1000 / _FPS );
		}
	}

	window.onEachFrame = onEachFrame;
})();


// helper for jquery hotkeys [ http://strd6.com/space_demo/javascripts/key_status.js ]
// from this [ http://www.html5rocks.com/en/tutorials/canvas/notearsgame/ ]
$(function() {
	window.keydown = {};

	function keyName(event) {
		return jQuery.hotkeys.specialKeys[event.which] ||
			String.fromCharCode(event.which).toLowerCase();
	}

	$(document).bind("keydown", function(event) {
		keydown.state = true;
		var name = keyName(event);
		if( _keys.indexOf( name ) !== -1 ) event.preventDefault();
		keydown[ name ] = true;
	});

	$(document).bind("keyup", function(event) {
		keydown.state = false;
		var name = keyName(event);
		if( _keys.indexOf( name ) !== -1 ) event.preventDefault();
		keydown[ name ] = false;
	});
});