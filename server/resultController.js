'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');

var router = express.Router();

router.get('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	res.status(200).send('Results!');
});

module.exports = router;