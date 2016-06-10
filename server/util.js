'use strict';
var ejs = require('ejs');
var Promise = require('bluebird');

var promisedRenderPage = Promise.promisify( ejs.renderFile );

function renderPage( name, data ){
	return promisedRenderPage( name, data, { strict: true, cache: true });
}

module.exports = {
	renderPage: renderPage
};