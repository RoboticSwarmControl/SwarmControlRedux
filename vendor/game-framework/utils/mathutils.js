window.mathutils = ( function() {
	'use strict';

    var lineDistance = function (x1,y1,x2,y2) {
        var xs = x1-x2;
        var ys = y1-y2;
        return Math.sqrt( (xs*xs)+(ys*ys) );
    };

    return {
        lineDistance : lineDistance,
    };
})();
