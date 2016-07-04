'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');

var router = express.Router();

router.get('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	res.status(200).send('Results!');
});

router.get('/:resultID', function _renderResultsIndex( req, res ) {
	URFP(req);
	res.status(200).send('Result '+ req.params.resultID);
});

router.post('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	res.status(201).send('Created result!');
});

module.exports = router;