/**
  Simplifies Canvas drawing operations.
  Extract the draw stuff from massive_manipulation.js into drawutils.js .
  Ideally we want to be able to call something as simple as 
  drawutils.drawCircle( x, y, radius, color) instead of the current pile 
  of canvas code. This is hugely useful.
  */

  var drawutils = (function(){

    var context = null;
    var $canvas = null;


    var drawCircle = function (x,y,radius,color,strokeWidth) {
      strokeWidth = typeof strokeWidth !== 'undefined' ? strokeWidth : 4;
      $canvas.drawArc({
        strokeStyle: color,
        strokeWidth: strokeWidth,
        x: x, y: y,
        radius: radius,
      });
    };

    var drawEllipse = function (x,y,width,height,rotate,color,strokeWidth) {
      strokeWidth = typeof strokeWidth !== 'undefined' ? strokeWidth : 4;
      $canvas.drawEllipse({
        strokeStyle: color,
        strokeWidth: strokeWidth,
        x: x, y: y,
        width: width, height: height,
        rotate: rotate
      });
    };

    
    var drawRobot = function (x,y,theta,radius,colorFill,colorEdge) {
      $canvas.drawArc({
        fillStyle: colorFill,
        strokeStyle: colorEdge,
        x: x, y: y,
        strokeWidth : 2,
        radius: radius
      });
    };

    var drawPolygon = function( x,y,radius,sides,rotate,color) {
        //default value for rotate if needed
        rotate = typeof rotate !== 'undefined' ? rotate : 0;
        $canvas.drawPolygon({
          fillStyle: color,
          x: x, y: y,
          radius: radius,
          sides: sides,
          rotate: rotate
        });
      };

      var drawRect = function (x,y,w,h,color,angle,colorEdge,strokeWidth) {
	//default value for angle if needed
	angle = typeof angle !== 'undefined' ? angle : 0;
  strokeWidth = typeof strokeWidth !== 'undefined' ? strokeWidth : 4;
  colorEdge = typeof colorEdge !== 'undefined' ? colorEdge : color;
  $canvas.drawRect({
    fillStyle:color,
    strokeWidth: strokeWidth,
    strokeStyle:colorEdge,
    x: x, y: y,
    width: w, height: h, cornerRadius: 0, rotate: angle
  });
};

var drawEmptyRect = function (x,y,w,h,color,angle,strokeWidth) {
	   //default value for angle if needed
	   angle = typeof angle !== 'undefined' ? angle : 0;
    strokeWidth = typeof strokeWidth !== 'undefined' ? strokeWidth : 4;
    $canvas.drawRect({
      strokeStyle:color,
      strokeWidth: strokeWidth,
      x: x, y: y,
      strokeWidth: 2,
      width: w, height: h, cornerRadius: 0, rotate: angle
    });
  };

  var drawLine = function (pts,color,closed, strokeWidth,rounded){
    closed = typeof closed !== 'undefined' ? closed : false;
    strokeWidth = typeof strokeWidth !== 'undefined' ? strokeWidth : 4;
    rounded = typeof rounded !== 'undefined' ? rounded : false;
    var obj = {
      strokeStyle:color,
      strokeWidth: strokeWidth,
      rounded: rounded,
      closed: closed
    };
        // Add the points from the array to the object
        for (var p=0; p<pts.length; p+=1) {
          obj['x'+(p+1)] = pts[p][0];
          obj['y'+(p+1)] = pts[p][1];
        }

        // Draw the line
        $canvas.drawLine(obj);
      };


    //http://en.literateprograms.org/Quickhull_(Javascript)
    function getDistant(cpt, bl) {
      var Vy = bl[1][0] - bl[0][0];
      var Vx = bl[0][1] - bl[1][1];
      return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
    };


    function findMostDistantPointFromBaseLine(baseLine, points) {
      var maxD = 0;
      var maxPt = new Array();
      var newPoints = new Array();
      for (var idx in points) {
        var pt = points[idx];
        var d = getDistant(pt, baseLine);

        if ( d > 0) {
          newPoints.push(pt);
        } else {
          continue;
        }

        if ( d > maxD ) {
          maxD = d;
          maxPt = pt;
        }
        
      } 
      return {'maxPoint':maxPt, 'newPoints':newPoints}
    };

    var allBaseLines = new Array();
    function buildConvexHull(baseLine, points) {

      allBaseLines.push(baseLine)
      var convexHullBaseLines = new Array();
      var t = findMostDistantPointFromBaseLine(baseLine, points);
        if (t.maxPoint.length) { // if there is still a point "outside" the base line
          convexHullBaseLines = 
        convexHullBaseLines.concat( 
          buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) 
          );
        convexHullBaseLines = 
        convexHullBaseLines.concat( 
          buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) 
          );
        return convexHullBaseLines;
        } else {  // if there is no more point "outside" the base line, the current base line is part of the convex hull
        return [baseLine];
      }    
    };

    var getConvexHull = function(points) {
        //find first baseline
        var maxX, minX;
        var maxPt, minPt;
        for (var idx in points) {
          var pt = points[idx];
          if (pt[0] > maxX || !maxX) {
            maxPt = pt;
            maxX = pt[0];
          }
          if (pt[0] < minX || !minX) {
            minPt = pt;
            minX = pt[0];
          }
        }
        var ch = [].concat(buildConvexHull([minPt, maxPt], points),
         buildConvexHull([maxPt, minPt], points))
        return ch;
      };


      var init = function () {
        context = $("#canvas")[0].getContext('2d');
        $canvas = $("#canvas");
      };

      var clearCanvas = function() {
        $canvas.clearCanvas();
      };

      var drawText = function(x,y,text, scale, colorEdge, colorFill,angle) {

        angle = typeof angle !== 'undefined' ? angle : 0;
        $canvas.drawText({
          fillStyle: colorEdge,
          fontSize: "40pts",
          strokeStyle: colorFill,
          scale: scale,
          strokeWidth: 1,
          x: x, y: y,
          text: text,
          rotate: angle,
              //TODO: display buttons for restart and show results
            });
      };

      return { drawLine : drawLine,
       getConvexHull : getConvexHull,
       drawCircle : drawCircle,
       drawEllipse : drawEllipse,
       drawPolygon : drawPolygon,
       drawRect : drawRect,
       drawEmptyRect : drawEmptyRect,
       drawRobot: drawRobot,
       clearCanvas : clearCanvas,
       drawText : drawText,
       init : init
     };
   })();
