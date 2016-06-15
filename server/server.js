'use strict';

var express = require('express');
var app = express();

var gameRouter = require('./gameController.js');
var resultRouter = require('./resultController.js');
var appRouter = require('./appController.js');

app.use('/results', resultRouter);
app.use('/games', gameRouter);
app.get('/', appRouter);

app.listen(3000);