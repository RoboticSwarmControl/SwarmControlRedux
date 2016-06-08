'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');

var router = express.Router();

router.get('/', function _renderGamesIndex( req, res) {
	URFP(req);
	res.status(200).send('Games!');
});

router.get('/:gameID', function _renderGame( req, res) {
	URFP(req);
	var game = req.params.gameID;
	res.status(200).send('Game ' + game);
});

module.exports = router;