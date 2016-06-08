'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');

var app = express();

function handleIndex( req, res ){
	URFP(req);
	res.status(200).send('Hi!');
}

var gameRouter = require('./server/gameController.js');
var resultRouter = require('./server/resultController.js');

app.use('/results', resultRouter)
app.use('/games', gameRouter);
app.get('/', handleIndex);

app.listen(3000);