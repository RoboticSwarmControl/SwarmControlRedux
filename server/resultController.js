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
		// fix date to be formatted usefully
		results = results.map( function _fixupDates( r ){
			/* jshint sub:true */
			r['created_at'] = r['created_at'].toISOString();
			r['updated_at'] = r['updated_at'].toISOString();
			return r;
		});

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
							res.status(200).json( {results:results} );
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
		// fix date to be formatted usefully
		results = results.map( function _fixupDates( r ){
			/* jshint sub:true */
			r['created_at'] = r['created_at'].toISOString();
			r['updated_at'] = r['updated_at'].toISOString();
			return r;
		});

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
							res.status(200).json( {results:results} );
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
	/* jshint sub:true */
	try{
		var info = {
			task: req.body.task,
			participant: req.cookies['task_sig'] || 'unknown',
			runtime: req.body.runtime,
			mode: req.body.mode,
			agent: req.body.agent || req.header('user-agent'),
			robotCount: req.body.numRobots,
			ending: req.body.ending
		};

		db.saveResult(info)
		.then( function() {
			res.status(201).json(info);
		})
		.catch( function(err) {
			console.log( err.toString() );
			res.status(500).json({ error: err});
		});
	} catch (err) {
		console.log( err.toString() );
		res.status(500).send( err.toString() );
	}
	
});

module.exports = router;