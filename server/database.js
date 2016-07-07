'use strict';
//function URFP( x ) { /* jshint expr:true */ x; }

var promise = require('bluebird');
var pgp = require('pg-promise') ( { promiseLib: promise });

var db;

function init( connectionString ) {
	db = pgp( connectionString );
}

function getResults() {
	return db.any('SELECT * FROM results;');
}

function getResultsForTask( task ) {
	return db.any('SELECT * FROM results WHERE task = $1;', [task] );
}

function saveResult( result ) {
	return db.none('INSERT INTO results(task, participant, runtime, mode, agent, robot_count) VALUES ($1, $2, $3, $4, $5, $6);',
					[
						result.task,
						result.participant,
						result.runtime,
						result.mode,
						result.agent,
						result.robotCount
					]);
}

module.exports = {
	init: init,
	getResults: getResults,
	getResultsForTask: getResultsForTask,
	saveResult: saveResult
};