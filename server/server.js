'use strict';

var express = require('express');
var app = express();
var path = require('path');

var db = require('./database.js');
var gameRouter = require('./gameController.js');
var resultRouter = require('./resultController.js');
var appRouter = require('./appController.js');

var listenPort = process.env.LISTEN_PORT || 3000;

console.log('Listening on port ', listenPort);
console.log('Connecting to database ', process.env.DB_STRING);

db.init( process.env.DB_STRING);
app.use('/results', resultRouter);
app.use('/games', gameRouter);
app.use('/', appRouter);
app.use('/assets', express.static( path.join(__dirname, '..', 'dist') ));

app.listen( listenPort );