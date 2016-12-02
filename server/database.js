'use strict';
//function URFP( x ) { /* jshint expr:true */ x; }

var promise = require('bluebird');
var pgp = require('pg-promise') ( { promiseLib: promise });

var db;

function init( connectionString ) {
	db = pgp( connectionString );
}


var getAllResultsQuery =	'SELECT' +
							' agent, created_at as "createdAt", ending, id, mode, participant, robot_count as "robotCount", runtime, task ' +
							' FROM results_redux;';
var getResultsForTaskQuery = 'SELECT' +
							 ' agent, created_at as "createdAt", ending, id, mode, participant, robot_count as "robotCount", runtime, task ' +
							 ' FROM results_redux WHERE task = $1;';

/* These queries omit information that is not used for charting. */
var getAllResultsQueryForDisplay =	'SELECT' +
									' ending, id, mode, participant, robot_count as "robotCount", runtime, task ' +
									' FROM results_redux;';
var getResultsForTaskQueryForDisplay = 'SELECT' +
							 ' ending, id, mode, participant, robot_count as "robotCount", runtime, task ' +
							 ' FROM results_redux WHERE task = $1;';

function getResults( displayOnly ) {
	return db.any( displayOnly ? getAllResultsQueryForDisplay : getAllResultsQuery );
}

function getResultsForTask( task, displayOnly ) {
	return db.any( displayOnly ? getResultsForTaskQueryForDisplay : getResultsForTaskQuery, [task] );
}

function saveResult( result ) {
	return db.none('INSERT INTO results_redux(task, participant, runtime, mode, agent, robot_count, ending) VALUES ($1, $2, $3, $4, $5, $6, $7);',
					[
						result.task,
						result.participant,
						result.runtime,
						result.mode,
						result.agent,
						result.robotCount,
						result.ending
					]);
}

module.exports = {
	init: init,
	getResults: getResults,
	getResultsForTask: getResultsForTask,
	saveResult: saveResult
};