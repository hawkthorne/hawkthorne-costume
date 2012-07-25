var gs = {}; // game state
	gs._char = false;
	gs._animation = false;
	gs._FPS = 60;
	gs._queue_delay = 0.16; // match common game delay for play buttons
	gs._queue_lfs = 0;
	gs._speed_change = 1;

// jquery query vars
var $form, $newhotness, $oldbusted, $character, $bg,
	$url, $artboard, $highlighter, $play_buttons, $stop,
	$canvas, c, $zoom_slide, $zoom_size, $char_toggle,
	$char_opacity, $char_opacity_size, $speed, $speed_display;

// primary image loaders
var image = {};
	image.character = false;
	image.costume = false;

// valid keys
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
	$speed = $('#speed');
	$speed_display = $('#speed_display');

	// start loading the character lua asap
	$.getJSON(
		'/lua/' + $character.val(),
		function(data, textStatus, jqXHR) {
			gs._char = data.data;
			gs._animation = data.data.animations;
			costumes = gs._char.costumes;
			costumes.shift();
			for( var i in costumes ) {
				var cost_url = encodeURIComponent( 'https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/' + gs._char.costumes[i].sheet );
				$('#in_game_costumes').append(
					$('<a href="/' + gs._char.name + '/' + cost_url + '">' + gs._char.costumes[i].name + '</a>')
				);
			}
			create_catalogue();
		}
	);

	c = $canvas[0];

	gs._dir = 'left';
	gs._motion = 'stop';
	gs._mouse = false;
	gs._next_frame = [ 0, 0 ];

	// animation queue
	gs._queue = [];

	$artboard.mousemove(function(e) {
		gs._queue = [];
		if( gs._mouse != 'lock' ) {
			gs._mouse = true;
			var loc = get_square_coords(e);
			$highlighter.css( {
				left: loc.X * 48,
				top: loc.Y * 48
			} );
			gs._next_frame = [ loc.X, loc.Y ];
			$artboard.attr(
				'title',
				  '[ ' + ( loc.X + 1 ) + ', ' + ( loc.Y + 1 ) + ' ]' + gs._catalogue[ loc.X ][ loc.Y ].join('')
			);
		}
	});

	$artboard.mouseout(function() {
		gs._mouse = false;
	})

	$artboard.click(function(e) {
		if( gs._mouse != 'lock' ) gs._mouse = 'lock';
		else gs._mouse = true;
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

	$speed.change(function() {
		var z = $speed.val();
		gs._speed_change = Math.floor( z / 100 ) ;
		$speed_display.html( z + '%');
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
		gs._mouse = false;
		if( action == 'play_all' ) {
			for_each_tile( function(x,y) {
				gs._queue.push( [ x, y ] );
			});
		} else if( action == 'stop' ) {
			gs._queue = [];
		}
	});

	init_canvas();

	// reload on change
	$character.change(function(e) { $url.val(''); $form.submit(); });
	$url.change(function(e) { $form.submit(); });

});

function create_catalogue() {
	// create a catalogue of known animation frames
	gs._catalogue = [];
	for_each_tile(
		function( x, y ) {
			if( gs._catalogue[ x ] == undefined ) gs._catalogue[ x ] = [];
			if( gs._catalogue[ x ][ y ] == undefined ) gs._catalogue[ x ][ y ] = [];
		},
		function() {
			for( var motion in gs._animation ) {
				for( var direction in gs._animation[ motion ] ) {
					gs._animation[ motion ][ direction ]._step = 0; // init a counter for future animations
					gs._animation[ motion ][ direction ]._lfs = 0;  // init a last frame stamp
					for( var frame in gs._animation[ motion ][ direction ][ 1 ] ) {
						var set = gs._animation[ motion ][ direction ][ 1 ];
						if( set[ frame ] instanceof Array && set[ frame ].length == 2 ) {
							gs._catalogue[ set[ frame ][0] ][ set[ frame ][1] ].push( "\n  " + motion + ' : ' + direction + "  " );
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
		gs._spinInterval = setInterval(draw,10);
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
		if( gs._spinInterval ) {
			clearInterval( gs._spinInterval );
			delete gs._spinInterval;
		}
		var ctx = c.getContext('2d');
		ctx.clearRect(0,0,c.height,c.width);

		// starts the animation loop
		(function animloop(){
			requestAnimFrame(animloop);
			render();
		})();

	}
}

function update() {
	var _now = (new Date).getTime();
	// handles all inspector movement
	if( gs._mouse == false && gs._animation ) {
		// check for key presses

		// simples have to go at the bottom!
		     if( keydown.alt && keydown.up )		{ gs._motion = 'gaze'; }
		else if( keydown.alt && keydown.down )		{ gs._motion = 'crouch'; }
		else if( keydown.a && keydown.space )		{ gs._motion = 'attackjump'; }
		else if( keydown.a && keydown.space )		{ gs._motion = 'attackjump'; }
		else if( keydown.a && keydown.left )		{ gs._motion = 'attackwalk'; }
		else if( keydown.a && keydown.right )		{ gs._motion = 'attackwalk'; }
		else if( keydown.shift && keydown.left )	{ gs._motion = 'holdwalk'; }
		else if( keydown.shift && keydown.right )	{ gs._motion = 'holdwalk'; }
		else if( keydown.up ) 						{ gs._motion = 'gazewalk'; }
		else if( keydown.down ) 					{ gs._motion = 'crouchwalk'; }
		else if( keydown.shift ) 					{ gs._motion = 'hold'; }
		else if( keydown.space ) 					{ gs._motion = 'jump'; }
		else if( keydown.x ) 						{ gs._motion = 'dead'; }
		else if( keydown.a ) 						{ gs._motion = 'attack'; }
		else if( keydown.left )						{ gs._motion = 'walk'; }
		else if( keydown.right )					{ gs._motion = 'walk'; }
		else										{ gs._motion = 'stop'; }

		// direction
		if( keydown.left ) { gs._dir = 'left' }
		else if( keydown.right ) { gs._dir = 'right' }

		// now be somebody!!!
		if( gs._motion !== 'stop' ) {
			gs._queue = [];
			if( gs._animation[ gs._motion ] ) {
				var _m = gs._animation[ gs._motion ][ gs._dir ];
				if( _m ) {
					if( _m._lfs + ( ( _m[2] * 1000 ) / gs._speed_change ) <= _now ) {
						gs._next_frame = _m[1][ _m._step++ % _m[1].length ];
						_m._lfs = _now;
						if( _m._step >= _m[1].length ) _m._step = 0;
					}
				}
			}
		} else if( gs._queue.length == 0 ) {
			gs._next_frame = gs._animation.idle[ gs._dir ][1][0];
		}
	}
	if( gs._queue.length > 0 && gs._queue_lfs + ( ( gs._queue_delay * 1000 ) / gs._speed_change ) <= _now ) {
		var o = gs._queue.shift();
		gs._next_frame = o;
		gs._queue_lfs = _now;
	}
}

function draw() {
	if( gs._mouse == 'lock' ) $highlighter.css({background: '#f00'});
	else $highlighter.css({background: ''});
	if( gs._next_frame ) {;
		$highlighter.css( {
			left: gs._next_frame[0] * 48,
			top: gs._next_frame[1] * 48
		} );
		render_image( gs._next_frame );
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

var render = (function() {
	var loops = 0,
		maxFrameSkip = 10,
		nextGameTick = (new Date).getTime();

	return function() {
		loops = 0;

		while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
			update();
			nextGameTick += ( 1000 / gs._FPS );
			loops++;
		}

		if( loops ) draw();
	};
})();

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function( callback ){
				window.setTimeout(callback, 1000 / gs._FPS);
			};
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
		var name = keyName(event);
		if( _keys.indexOf( name ) !== -1 ) event.preventDefault();
		keydown[ name ] = true;
	});

	$(document).bind("keyup", function(event) {
		var name = keyName(event);
		if( _keys.indexOf( name ) !== -1 ) event.preventDefault();
		keydown[ name ] = false;
	});
});