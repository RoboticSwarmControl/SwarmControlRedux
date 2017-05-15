'use strict';
//function URFP( x ) { /* jshint expr:true */ x; }

var promise = require('bluebird');
var pgp = require('pg-promise') ( { promiseLib: promise });

var db;

function init( connectionString ) {
	db = pgp( connectionString );
}

function getResults( filterOptions ) {
	var participant = filterOptions.participant;
	var task = filterOptions.task;
	var forDisplay = filterOptions.forDisplay;

	/* Make sure you don't forget the trailling spaces in these clauses if you change them! -crertel */
	var query = 'SELECT ' + 
				((forDisplay)?(' ending, id, mode, participant, robot_count as "robotCount", runtime, task, created_at as "createdAt" ')
							:(' agent, created_at as "createdAt", ending, id, mode, participant, robot_count as "robotCount", runtime, task ') )+
				'FROM results_redux ';
	var queryParams = [];

	if ( participant || task ) {
		query += ' WHERE ';
		var param = 1;

		if (participant) {
			query += ' participant=$' + param + ' ';
			param++;
			queryParams.push(participant);
		}

		if (task) {
			if (participant) {
				query += ' AND ';
			}
			query += ' task=$' + param + ' ';
			queryParams.push(task);
		}
	}

	query += ';';

	return db.any( query, queryParams);
}

function saveResult( result ) {
	return db.none('INSERT INTO results_redux(task, participant, runtime, mode, agent, robot_count, ending, extra) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
					[
						result.task,
						result.participant,
						result.runtime,
						result.mode,
						result.agent,
						result.robotCount,
						result.ending,
						result.extra || {}
					]);
}

module.exports = {
	init: init,
	getResults: getResults,
	saveResult: saveResult
};