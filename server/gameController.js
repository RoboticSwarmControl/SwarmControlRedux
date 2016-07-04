'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');
var util = require('./util.js');
var router = express.Router();
var fs = require('fs');
var path = require('path');

var mountedGames = [];

function loadGames() {
	var gameDirectory = util.getGameDirectory();
	var games = fs.readdirSync( gameDirectory );
	games.forEach( function _mountGame( gameName ){ 
		try {
			var gameDir = path.join(gameDirectory, gameName);
			console.log(gameDir);
			var manifestRaw = fs.readFileSync( path.join( gameDir, 'manifest.json'), { encoding:'utf8'});
			var manifest = JSON.parse(manifestRaw);
			util.assertField( manifest, 'name', 'manifest');
			util.assertField( manifest, 'xAxisLabel', 'manifest');
			util.assertField( manifest, 'displayName', 'manifest');

			manifest.paths = {
				instructions: path.join( gameDir, 'instructions.html.ejs'),
				science: path.join( gameDir, 'science.html.ejs'),
				game: '/assets/games/' + gameName+ '/' + gameName + '.js'
			};

			fs.statSync( manifest.paths.instructions );
			fs.statSync( manifest.paths.science );

			router.get('/' + manifest.name , function _renderGame( req, res) {	
				URFP(req);				

				util.renderPage('game.html.ejs',
								{
									taskName: manifest.displayName,
									gameScriptPath: manifest.paths.game,
									sciencePartial: manifest.paths.science,
									instructionsPartial: manifest.paths.instructions,
								})
				.then( function (page) {
					res.status(200).send(page);
				})
				.catch(function (err) {
					res.status(500).send(err.toString());
				});
			});

			mountedGames.push(manifest);
		} catch(e) {
			console.log( 'Unable to load game '+ gameName + ':\n\t', e.toString() );
		}		
	});
}

loadGames();

router.get('/', function _renderGamesIndex( req, res) {
	URFP(req);
	util.renderPage('landing.html.ejs', { tasks: mountedGames })
	.then( function (page) {
		res.status(200).send(page);
	})
	.catch(function (err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;