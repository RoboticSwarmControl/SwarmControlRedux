window.resultutils = (function ($,_, Flotr) {
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }

    function trendline( pts ){
        var sx    = 0,
            sy    = 0,
            sxy   = 0,
            sxsq  = 0,
            xmean,x,y,
            ymean,
            alpha,
            beta,n = 0;
        for( var i = 0; i<pts.length; i++){
            // Computations used for regression line
            x = pts[i][0];
            y = pts[i][1];
            if( !isNaN(x) && !isNaN(y) ){
                sx += x;
                sy += y;
                sxy += x*y;
                sxsq += Math.pow(x,2);
                n=n+1;
            }
        }
        xmean = sx/n;
        ymean = sy/n;
        beta  = ((n*sxy) - (sx*sy))/((n*sxsq)-(Math.pow(sx,2)));
        alpha = ymean - (beta * xmean);
        return [alpha,beta];
    }

    function parseTime( input ){  //convert time to number, do some error checking
        var y = parseFloat(input);
        if (y > 60*60){
            y = NaN; //remove egregious outliers -- if a task takes more than an hour, that's ridiculous
        }  
                    
        return y;
    }

    function plotTask($container, $task, prettyTaskName, xAxisLabel, taskResults, userResults, isHistogram){
        console.log(arguments);
        URFP(userResults);

        $container.append($task);
        var res = taskResults;

        var d2 = [],    // A regression line for the scatterplot. 
            dme = [],   //regression line of my data
            x, y;

        // two tasks where the number of robots is varied: maze_positioning, robot_positioning 
        // varying_control, forage, varying_visualization  x-axis is the mode (string) (these are bar charts?)
        //  pyramid_building  is a function of the noise, saves as the mode
        // ...and add the data points for the graph...
        var points = [];  //all data points
        var mypoints = []; //my data points
        var ymax=Number.MIN_VALUE;
        var ymin=Number.MAX_VALUE;
        var xmax=Number.MIN_VALUE;
        var xmin=Number.MAX_VALUE;

        var modes = _.groupBy( res, function (m) { return m.mode;} );
        var modekeys = _.keys(modes);
        var mostRecentTime = null;
        var mostRecentx = NaN;
        var mostRecenty = NaN;
        var mostRecentIsParticipant = false;

        _.each( res, function (r) {
            y = parseTime(r.runtime);
                                
            if (r.task === 'maze_positioning' || r.task === 'robot_positioning'){
                //xAxisLabel = 'Number of robots';
                x = r.robotCount;
            }else if (r.task ==='varying_control' || r.task === 'forage' ){
                //xAxisLabel = 'Control type';
                x = _.indexOf(modekeys, r.mode);
            }else if(r.task === 'varying_visualization'){
                //xAxisLabel = 'Visualization Method';
                x = _.indexOf(modekeys, r.mode);
            }else if(r.task === 'pyramid_building'){
                //xAxisLabel = 'Noise (% control power)';
                x = 20*parseFloat(r.mode);
            }else{
                // error in database
                //xAxisLabel = 'Unknown';
                x = r.robotCount;
            }

            if( !isNaN(x) && !isNaN(y) ){
                ymax = ymax < y ? y : ymax;
                ymin = ymin > y ? y : ymin;
                xmax = xmax < x ? x : xmax;
                xmin = xmin > x ? x : xmin;

                points.push( [x, y] );
                //if( r.participant === myParticipant) {
                    //mypoints.push( [x, y] );
                //}
                if( mostRecentTime === null || r.createdAt > mostRecentTime){
                    mostRecentTime = r.createdAt;
                    mostRecentx = x;
                    mostRecenty = y;
                    mostRecentIsParticipant = false; //( r.participant === myParticipant);
                }
            }
        });

        // Compute the regression line.
        var dataTrendline = trendline(points);
        d2.push([xmin, dataTrendline[0] + dataTrendline[1]*xmin]);
        d2.push([xmax, dataTrendline[0] + dataTrendline[1]*xmax]);
        var mydataTrendline = trendline(mypoints);
        dme.push([xmin, mydataTrendline[0] + mydataTrendline[1]*xmin]);
        dme.push([xmax, mydataTrendline[0] + mydataTrendline[1]*xmax]);
        var xrange = xmax-xmin;
        var yrange = ymax-ymin;

        var robotCounts = _.groupBy( res, function (m) { return m.robotCount;} );
        var mtitle = prettyTaskName;
        if( mypoints.length === 1){
            mtitle = mtitle + ' -- Play again to get a trendline!';
        }
        var msubtitle =  res.length + ' results, with ' + _.keys(modes).length  + ' modes, and ' + _.keys(robotCounts).length + ' different # of robots';//+ xmin + "," + dataTrendline[0] + "," + dataTrendline[1] + "," +xmax + ".";

        // ...and then append the graph. 
        var margins = 0.05;   
        var myTicks = null;
        if(isHistogram) {
            myTicks = [];
            var xCounts = [];
            var yMeans = [];
            var myxCounts = [];
            var myyMeans = [];
            for( var i = 0; i<modekeys.length; i++){
                myTicks.push([i, modekeys[i] ]);
                xCounts.push(0);
                yMeans.push(0);
                myxCounts.push(0);
                myyMeans.push(0);
            }    
            _.each( res, function (r) {
                var ind = _.indexOf(modekeys, r.mode);
                var yVal = parseTime(r.runtime);
                if( !isNaN(yVal) ){
                    xCounts[ind] = xCounts[ind]+1;
                    yMeans[ind] = yMeans[ind] + yVal;
                    /*
                    if( r.participant === myParticipant) {
                        myxCounts[ind] = myxCounts[ind]+1;
                        myyMeans[ind] = myyMeans[ind] + yVal;
                    }
                    */
                 }
            });
            d2.length = 0; // clear the array, and fill with new 
            dme.length = 0; // clear the array, and fill with new data
            for( i = 0; i<modekeys.length; i++)
            { 
                d2.push([i, yMeans[i]/xCounts[i] ]);
                dme.push([i, myyMeans[i]/myxCounts[i] ]);
            }

        }
        var legendPos = 'nw';//default legend position in nw
        if( dataTrendline[1] <0 )
           { legendPos = 'sw';}
        var data = [
                {data: d2, label : 'trend (all)', color:'darkblue', lines : { fill : true , lineWidth : 4}  },  // Regression, all data
                {data: points, label: 'results (all)', points: {show:true}, color:'blue' },
            ];
        if( mypoints.length >= 2){
            data.push( {data:dme, label : 'trend (me)', color:'darkred', lines : { lineWidth : 4 }  });  // Regression
        }
        if( mypoints.length >= 1){
            data.push({ data:mypoints, label: 'results (me)', points: {show:true}, color:'red' });
        }
        var mostRecentFillColor = 'lightgreen';
        var mostRecentLineColor = 'green';
        var mostRecentSize = 5;
        if( mostRecentIsParticipant){
            mostRecentFillColor = 'pink';
            mostRecentLineColor = 'darkred';
            mostRecentSize = 8;
        }
        data.push({ data:[[mostRecentx,mostRecenty]], label: 'newest result', points: {show:true, radius: mostRecentSize,fillColor: mostRecentFillColor}, color:mostRecentLineColor}); //most recent result


        Flotr.draw( $task[0],
            data,
            {  
                mouse : {
                        track : true,
                        relative : true,
                        radius : 12,
                      },
                xaxis: { min: xmin - margins*xrange, 
                        max: xmax + margins*xrange, 
                        title: xAxisLabel,
                        ticks: myTicks,
                        labelsAngle: 45
                    },
                yaxis: { min: ymin - margins*yrange, max: ymax + margins*yrange, title: 'Time (s)'},
                title :mtitle,
                subtitle : msubtitle,
                legend:{
                    position: legendPos
                 }

        });
        return mypoints.length;
    }


    function plot( $container, xAxisLabel, taskPrettyName, taskResults, userResults) {
        
        //var $task = $('<div style="width:500px;height:500px"></div>');
        var $task = $('<div class="results-chart"></div>');

        var isHistogram =   taskResults[0].task === 'varying_control' ||
                            taskResults[0].task === 'forage' ||
                            taskResults[0].task === 'varying_visualization';

        plotTask( $container, $task, taskPrettyName, xAxisLabel, taskResults, userResults, isHistogram);
    }

    return {
        plot: plot
    };
})( window.$, window._, window.Flotr);
