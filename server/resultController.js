'use strict';
function URFP( x ) { /* jshint expr:true */ x; }
var express = require('express');
var router = express.Router();

var util = require('./util.js');
var db = require('./database.js');
var csv = require('fast-csv');

router.get('/', function _renderResultsIndex( req, res ) {
	URFP(req);
	db.getResults()
	.then( function( results ) {
		switch (req.query.download) {
			case 'csv': 	csv.writeToString(	results,
												{ headers: true},
												function (err, data) {
														if (err ){
															res.status(500).send( err.toString() );
														} else {
															res.type('text/csv').status(200).send( data );
														}
												});
							break;
			case 'json': 	
							res.status(200).json( {res:results} );
							break;
			default: 		util.renderPage('results.html.ejs')
							.then( function (page) {
								res.status(200).send(page);
							})
							.catch(function (err) {
								res.status(500).send(err.toString());
							});
		}
	})
	.catch( function ( err ) {
		console.log( err.toString() );
		res.status(500).send( err.toString() );
	});
});

router.get('/:resultID', function _renderResultsIndex( req, res ) {	
	db.getResultsForTask( req.params.resultID)
	.then( function( results ) {
		switch (req.query.download) {
			case 'csv': 	csv.writeToString(	results,
												{ headers: true},
												function (err, data) {
														if (err ){
															res.status(500).send( err.toString() );
														} else {
															res.type('text/csv').status(200).send( data );
														}
												});
							break;
			case 'json': 	
							res.status(200).json( {res:results} );
							break;
			default: 		util.renderPage('results.html.ejs')
							.then( function (page) {
								res.status(200).send(page);
							})
							.catch(function (err) {
								res.status(500).send(err.toString());
							});
		}
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