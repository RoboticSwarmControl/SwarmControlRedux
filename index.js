'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');
var app = express();

var gameRouter = require('./server/gameController.js');
var resultRouter = require('./server/resultController.js');
var appRouter = require('./server/appController.js');

app.use('/results', resultRouter)
app.use('/games', gameRouter);
app.get('/', appRouter);

app.listen(3000);