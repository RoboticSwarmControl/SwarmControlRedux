/* requestAnimationFrame polyfill */
 window.requestAnimFrame = ( function() {
 	'use strict';
 	function URFP( x ) { /* jshint expr:true */ x; }

    return  window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame   || 
    window.mozRequestAnimationFrame      || 
    window.oRequestAnimationFrame        || 
    window.msRequestAnimationFrame       || 
    function( callback, element) {
    	URFP(element);
    	window.setTimeout(callback, 1000 / 60);
    };
})();
