'use strict';
var express = require('express');
var util = require('./util.js');
var router = express.Router();

router.get('/:gameID', function _renderGame( req, res) {	
	var game = req.params.gameID;
	
	util.renderPage('game.html.ejs', { taskName: game })
	.then( function (page) {
		res.status(200).send(page);
	})
	.catch(function (err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;