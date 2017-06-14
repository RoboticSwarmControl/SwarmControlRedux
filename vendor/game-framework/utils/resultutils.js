window.resultutils = (function ($,_, Flotr) {
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }

    var myParticipant =  document.cookie.slice(document.cookie.indexOf('task_sig')+('task_sig').length+1); //substring starting at task_sig 
    if (myParticipant.indexOf(';') !== -1) {
        myParticipant = myParticipant.substr(0,myParticipant.indexOf(';')); //trim any extra info off the string
    }

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
        var y = Number.parseFloat(input);
        if (y > 60*60){
            y = NaN; //remove egregious outliers -- if a task takes more than an hour, that's ridiculous
        }  
                    
        return y;
    }

    /* N.B. -- This will not ignore tasks that have not been "won". Do that when filtering results before
            you try to plot them here. --crertel
    */

    function plotTask($container, $task, prettyTaskName, xAxisLabel, taskResults, userResults, isHistogram){
        URFP(isHistogram);
        URFP(userResults);

        $container.append($task);
        var res = taskResults;

        var d2 = [];    // A regression line for the scatterplot. 
        var dme = [];   //regression line of my data
        var x, y;

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

        _.each( res, function (r) {
            y = parseTime(r.runtime);
            
            if (r.task === 'varying-number' || r.task === 'robot-positioning'|| r.task === 'peg-in-hole'){
                x = r.robotCount;
            }else if (r.task ==='varying-control-scheme' ||
                r.task === 'foraging' ||
                r.task === 'predator' ||
                r.task === 'varying-visualization' ||
                r.task === 'assembly' ||
                r.task === 'assembly-and-delivery' ||
                r.task === 'puzzle'){
                x = _.indexOf(modekeys, r.mode);
            }else if(r.task === 'pyramid-building'){
                x = 10*parseFloat(r.mode);
            }else{
                x = r.robotCount;
            }

            if( !isNaN(x) && !isNaN(y) ){                
                ymax = ymax < y ? y : ymax;
                ymin = ymin > y ? y : ymin;
                xmax = xmax < x ? x : xmax;
                xmin = xmin > x ? x : xmin;
                
                points.push( [x, y] );
                if( r.participant === myParticipant) {
                    mypoints.push( [x, y, new Date(r.createdAt)] );
                }
            }
        });
    
        mypoints = mypoints.sort( function _sortByTime(a,b){
            return a[2] <= b[2];
        }).map( function _removeTime(el) { return [el[0], el[1]]; });

        var xrange = xmax-xmin;
        var yrange = ymax-ymin;

        // Compute the regression line.
        var dataTrendline = trendline(points);
        d2.push([xmin, dataTrendline[0] + dataTrendline[1]*xmin]);
        d2.push([xmax, dataTrendline[0] + dataTrendline[1]*xmax]);
        var mydataTrendline = trendline(mypoints);
        dme.push([xmin, mydataTrendline[0] + mydataTrendline[1]*xmin]);
        dme.push([xmax, mydataTrendline[0] + mydataTrendline[1]*xmax]);        

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
                    
                    if( r.participant === myParticipant) {
                        myxCounts[ind] = myxCounts[ind]+1;
                        myyMeans[ind] = myyMeans[ind] + yVal;
                    }
                    
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
        var legendPos = 'nw'; //default legend position in nw

        if( dataTrendline[1] <0 ) {
            legendPos = 'sw';
        }

        var data = [
                {data: d2, label : 'trend (all)', color:'darkblue', lines : { fill : true , lineWidth : 4}  },  // Regression, all data
                {data: points, label: 'results (all)', points: {show:true}, color:'blue' },
            ];
        
        if( mypoints.length >= 2){
            data.push( {data:dme, label : 'trend (me)', color:'darkred', lines : { lineWidth : 4 }  });  // Regression
        }
        if( mypoints.length >= 1){
            data.push({ data:mypoints, label: 'results (me)', points: {show:true}, color:'red' });

            data.push({ data:[mypoints[0]],
                        label: 'newest result',
                        points: {   show:true,
                                    radius: 5,
                                    fillColor: 'lightgreen'
                                },
                        color: 'green'}); //most recent result
        }

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
                        yaxis: {
                                    min: ymin - margins*yrange,
                                    max: ymax + margins*yrange,
                                    title: 'Time (s)'
                        },
                        title :mtitle,
                        subtitle : msubtitle,
                        legend: {
                            position: legendPos
                        }
                    });
    }


    function plot( $container, xAxisLabel, taskPrettyName, taskResults, userResults) {        
        var $task = $('<div class="results-chart"></div>');

        var isHistogram =   taskResults[0].task === 'varying-control-scheme' ||
                            taskResults[0].task === 'foraging' ||
                            taskResults[0].task === 'varying-visualization' ||
                            taskResults[0].task === 'predator' ||
                            taskResults[0].task === 'peg-in-hole' ||
                            taskResults[0].task === 'assembly'  ||
                            taskResults[0].task === 'assembly-and-delivery' ||
                            taskResults[0].task === 'puzzle';

        plotTask( $container, $task, taskPrettyName, xAxisLabel, taskResults, userResults, isHistogram);
    }

    return {
        plot: plot
    };
})( window.$, window._, window.Flotr);
