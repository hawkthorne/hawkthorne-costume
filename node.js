/**
 * Module dependencies.
 */

var express = require('express'),
	jinjs = require('jinjs'),
	gm = require('gm'),
	imageMagick = gm.subClass({ imageMagick: true }),
	lua = require('./luaparser'),
	path = require('path'),
	crypto = require('crypto'),
	fs = require('fs');

// start the app
var app = module.exports = express.createServer();

var baseurl = "https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/images/"
  , characters = ['jeff', 'troy', 'annie', 'britta', 'shirley', 'pierce', 'abed'];

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/templates');
	app.set('view engine', 'jinjs');
	app.set("view options", { jinjs_pre_compile: function (str) { return parse_pwilang(str); } });
	app.set("view options", { layout: false });
	app.register('.html', jinjs);
	app.use('/static',express.static(__dirname + '/static'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/big/:path', function (req, res, next) {
	var _path = decodeURIComponent( req.params.path ) || false;
	if( _path.match( /^https?:\/\// ) ) {
		var md5 = crypto.createHash('md5').update(_path).digest('hex'),
			ext = _path.substr(_path.lastIndexOf('.') + 1),
			cached_file = 'static/cache/' + md5 + '.' + ext;
		if( path.existsSync( cached_file ) ) {
			console.log(' found ' + cached_file );
		    res.redirect( '/' + cached_file );
		} else {
			console.log(' didnt find ' + cached_file );
			imageMagick( _path )
				.quality(100)
				.antialias(false)
				.size( function( err, value ) {
					if( err ) {
						res.json(err,404);
					} else {
						this.scale( value.width * 10, value.height * 10 );
						this.stream(function (err, stdout, stderr) {
							stderr.setEncoding('utf8');
							stderr.on('data',function(data){console.log('stderr',data)});
							if (err) {
								res.json(err,404);
							} else {
							    var writeStream = fs.createWriteStream( cached_file );
								stdout.pipe( writeStream );
								stdout.on('end', function() {
									console.log(stdout);
									console.log(' writing ' + cached_file + ' to cache ');
									res.redirect( '/' + cached_file );
								});
							}
						});
					}
				}
			);
		}
	} else {
		res.json( "LOL whut?", 404 );
	}
});

app.get('/lua/:character', lua);

app.get('/:character/:in_url?', function(req, res) {

	var character = req.params.character;
	var in_url = req.params.in_url || '';

	if( characters.indexOf( character.toLowerCase() ) === -1 ) {
		res.send( "I don't know who that character is", 404 );
	} else {
		url = decodeURIComponent( in_url );
		if( url && !url.match( /^https?:\/\//i ) && !url.match( /^data:/i ) ) {
			url = "http://" + url;
		}

		res.render('index.html', {
			source: url,
			characters: characters,
			character: character,
			original: baseurl + character + ".png"
		} );
	}

});

app.get('/', function( req, res ) {
	res.redirect('/abed');
});

app.post('/*', function( req, res ) {
	var character = req.body.character || 'abed',
		costume = req.body.url || false,
		url = '/' + character;
	if( costume ) url += '/' + encodeURIComponent( costume );
	res.redirect( url );
});

app.get('*', function( req,res ) { res.send(404); } );

app.dynamicHelpers({
	url_for: function() { return function( dir, filename ) { return '/' + dir + '/' + filename; }; }
});

var port = process.env.PORT || 5000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
