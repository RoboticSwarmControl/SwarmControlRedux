'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');

var router = express.Router();

router.get('/', function( req, res) {
	URFP(req);
	res.status(200).send('Results!');
});

return router;