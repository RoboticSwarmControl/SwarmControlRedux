'use strict';
var ejs = require('ejs');
var path = require('path');
var Promise = require('bluebird');

var promisedRenderPage = Promise.promisify( ejs.renderFile );

function renderPage( name, data ){
	return promisedRenderPage(	path.join(__dirname, 'views', name),
								data,
								{
									/* we set strict to true to prevent certain JS weirdness that can occur */
									strict: true,

									/*
										cache only in production--in dev, we want to reload pages when
										we change the markup and instantly see the effect
									*/
									cache:  process.env.NODE_ENV === 'production'
								});
}

module.exports = {
	renderPage: renderPage
};