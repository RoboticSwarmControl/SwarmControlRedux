var express = require('express');
var app = express();

function handleIndex( req, res ){
	res.status(200).send('Hi!');
}

app.get('/', handleIndex);
app.listen(3000);