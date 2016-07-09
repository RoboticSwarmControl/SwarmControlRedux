'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');
var router = express.Router();

var db = require('./database.js');
var csv = require('fast-csv');

router.get('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	db.getResults()
	.then( function( results ) {
		// helpful trick from http://expressjs.com/en/4x/api.html#res.format
		res.format({			
			'text/csv': function() {
				csv.writeToString(	results,
									{ headers: true},
									function (err, data) {
											if (err ){
												res.status(500).send( err.toString() );
											} else {
												res.status(200).send( data );
											}
									});
			},
			'text/json': function() {
				res.status(200).json( {res:results} );
			},
			'default': function () {
				res.sendStatus(406); // bad MIME type requested
			}
		});		
	})
	.catch( function ( err ) {
		console.log( err.toString() );
		res.status(500).send( err.toString() );
	});
});

router.get('/:resultID', function _renderResultsIndex( req, res ) {	
	db.getResultsForTask( req.params.resultID)
	.then( function( results ) {
		// helpful trick from http://expressjs.com/en/4x/api.html#res.format
		res.format({			
			'text/csv': function() {
				csv.writeToString(	results,
									{ headers: true},
									function (err, data) {
											if (err ){
												res.status(500).send( err.toString() );
											} else {
												res.status(200).send( data );
											}
									});
			},
			'text/json': function() {
				res.status(200).json( {res:results} );
			},
			'default': function () {
				res.sendStatus(406); // bad MIME type requested
			}
		});		
	})
	.catch( function ( err ) {
		console.log( err.toString() );
		res.status(500).send( err.toString() );
	});
});

router.post('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	res.status(201).send('Created result!');
});

module.exports = router;