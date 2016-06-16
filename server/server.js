'use strict';

var express = require('express');
var app = express();
var path = require('path');

var gameRouter = require('./gameController.js');
var resultRouter = require('./resultController.js');
var appRouter = require('./appController.js');

app.use('/results', resultRouter);
app.use('/games', gameRouter);
app.get('/', appRouter);
app.use('/assets', express.static( path.join(__dirname, '..', 'dist') ));

app.listen(3000);