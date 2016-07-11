'use strict';

var express = require('express');
var app = express();
var path = require('path');
var crypto = require('crypto');

var db = require('./database.js');
var gameRouter = require('./gameController.js');
var resultRouter = require('./resultController.js');
var appRouter = require('./appController.js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var listenPort = process.env.LISTEN_PORT || 3000;

console.log('Listening on port ', listenPort);
console.log('Connecting to database ', process.env.DB_STRING);

db.init( process.env.DB_STRING);

var kTwentyYears = 1000 * 60 * 60 * 24 * 365 * 20;

// Make sure we can get the cookies.
app.use( cookieParser() );
app.use( bodyParser.json() );
app.use( function _addTaskSig( req, res, next ) {
	/* jshint sub:true */
	if (!req.cookies['task_sig']) {
		res.cookie( 'task_sig',
					crypto.randomBytes(16).toString('hex'),
					{
						expires: kTwentyYears,
						maxAge: Date.now() + kTwentyYears
					});
	}
	next();
});

// Setup the route controllers
app.use('/results', resultRouter);
app.use('/games', gameRouter);
app.use('/', appRouter);
app.use('/assets', express.static( path.join(__dirname, '..', 'dist') ));

// Start the server.
app.listen( listenPort );