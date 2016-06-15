'use strict';
var ejs = require('ejs');
var path = require('path');
var Promise = require('bluebird');

var promisedRenderPage = Promise.promisify( ejs.renderFile );

function renderPage( name, data ){
	return promisedRenderPage(	path.join(__dirname, 'views', name),
								data,
								{ strict: true, cache: true });
}

module.exports = {
	renderPage: renderPage
};