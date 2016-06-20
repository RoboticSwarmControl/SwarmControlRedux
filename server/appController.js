'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');
var router = express.Router();
var util = require('./util.js');

router.get('/', function _renderGamesIndex( req, res) {
	URFP(req);
	util.renderPage('landing.html.ejs', { tasks: [] })
	.then( function (page) {
		res.status(200).send(page);
	})
	.catch(function (err) {
		res.status(500).send(err.toString());
	});
});

router.get('/videos', function _renderVideos( req, res) {
	URFP(req);
	util.renderPage('videos.html.ejs', { tasks: [] })
	.then( function (page) {
		res.status(200).send(page);
	})
	.catch(function (err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;