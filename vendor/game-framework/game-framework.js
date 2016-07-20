/*
	game-framework.js -- Supporting framework for the swarm control games.

	This framework is meant to give a unified interface for handling rendering, game lifecycle, and  so forth.
*/

(function _setupGameFramework( box2D, $, drawutils, phys, resultutils ) {
	'use strict';
	function URFP( x ) { /* jshint expr:true */ x; }

	URFP(box2D);

	function GameFramework( taskName, prettyTaskName, xAxisLabel ) {

		/*
			A game exists in one of the following states:

			- 'spawnWorld' : The game is setting up all the physics, input handlers, etc.
								The game moves to 'initTask' state.
			- 'initTask' : The game is setting the positions of all the tasks, resetting counters, so forth.
								The game moves to to 'overview' state.

			- 'overview' : The game is showing it's instruction diagram.
							Any input moves it to 'running'.
			- 'running' : The game is running the simulation and accepting input.
							If no input has occurred in some time, game moves to 'paused' state.
							If game is tabbed away from, game moves to 'paused' state.
							If win condition met, game moves to 'won' state.
							If failure condition met, game moves to 'lost' state.
							By default, game moves to 'running' state.

			- 'paused' : The game is asking the user if they've got input or have forgotten about it.
							If no input has occurred for some time in this state, game moves to 'abandoned' state.
							If any input occurs, game is moved back to 'running' state.

			- 'won'		: The game has finished and the player has won.
								Game moves now to 'halted' state.

			- 'lost'	: The game has finished and player has lost (failure or timeout).
								Game moves now to 'halted' state.

			- 'abandoned' : The game has been untouched long enough that the pause state put us here. Draw a message.
								Game moves now to 'halted' state.

			- 'halted' : Terminal state. Application stops. Results are submitted and graphs drawn.
		*/

		this._currentState = this.doStateSpawnWorld;

		this.taskName = taskName || 'unnamed-task';
		this.prettyTaskName = prettyTaskName || this.taskName;
		this.xAxisLabel = xAxisLabel || 'unknown label';
		
		this.world = null;

		this.mobileUserAgent = false;
		this.useKeyboard = false; // updated as soon as keyboard events occur

		this.ending = 'aborted';

		this.kAllowedTimeWithoutInput = 10*1000;	// 10 seconds before we think the user has abandoned us
		this.kAllowedTimeInPause = 30*1000; // 30 secs in pause before moving on
		
		this._spawnWorldCallback = function () { };
		this._initTaskCallback = function () { };
		this._overviewCallback = function () { };
		this._pregameCallback = function () { };
		this._drawCallback = function () { };
		this._updateCallback = function () { };
		this._lostCallback = function () { };
		this._wonCallback = function () { };
		this._winTestCallback = function () { return false; };
		this._loseTestCallback = function () { return false; };	
		this._submitResultsCallback = function () { return {}; };

		this.constants = {};
		this.constants.zeroRef = new phys.vec2(0,0);
		this.constants.keys = {
			UP: 	38,
			DOWN: 	40,
			LEFT: 	37,
			RIGHT: 	39,
		};

		this.constants.colorRobot = 'blue';
	    this.constants.colorRobotEdge = 'rgb(50,50,255)';
	    this.constants.colorRobotGoal = 'blue';
	    this.constants.colorRobotAtGoal = 'lightblue';
	    this.constants.colorObstacle = 'rgb(95,96,98)';
	    this.constants.colorGoalArrow = 'rgb(0,110,0)';
	    this.constants.colorGoal = 'green';  				// color of unclocked button (middle) 'green',
	    this.constants.colorObject = 'green';  				// color of clicked button,  'green' = 0,128,0,
	    this.constants.colorObjectEdge = 'darkgreen';		// color of clicked button border 'darkgreen',
	    this.constants.colorObjectAtGoal = 'lightgreen';
	    this.constants.strokeWidth = 2;
	    this.constants.strokeWidthThick = 4;
	    this.constants.obsThick = 0.2;						//thickness of obstacles at edges and internally
	}

	GameFramework.prototype.setSpawnWorldCallback = function ( spawnWorldCb ) {
		this._spawnWorldCallback = spawnWorldCb.bind(this);
	};
	GameFramework.prototype.setInitTaskCallback = function ( initTaskCb ) {
		this._initTaskCallback = initTaskCb.bind(this);
	};

	GameFramework.prototype.setOverviewCallback = function ( overviewFunctionCb ) {
		this._overviewCallback = overviewFunctionCb.bind(this);
	};

	GameFramework.prototype.setPregameCallback = function ( pregameCb ) {
		this._pregameCallback = pregameCb.bind(this);
	};

	GameFramework.prototype.setUpdateCallback = function ( updateFunctionCb ) {
		this._updateCallback = updateFunctionCb.bind(this);
	};

	GameFramework.prototype.setDrawCallback = function ( drawCb ) {
		this._drawCallback = drawCb.bind(this);
	};

	GameFramework.prototype.setWinTestCallback = function ( winTestCallback ) {
		this._winTestCallback = winTestCallback.bind(this);
	};

	GameFramework.prototype.setLoseTestCallback = function ( lostTestCallback ) {
		this._loseTestCallback = lostTestCallback.bind(this);
	};

	GameFramework.prototype.setLostCallback = function ( lostCb) {
		this._lostCallback = lostCb.bind(this);
	};

	GameFramework.prototype.setWonCallback = function( wonCb ) {
		this._wonCallback = wonCb.bind(this);
	};

	GameFramework.prototype.setResultsCallback = function ( resultsCb ) {
		this._submitResultsCallback = resultsCb.bind(this);
	};

	GameFramework.prototype.doStateSpawnWorld = function ( dt, inputEvents ){
		URFP( dt );
		URFP( inputEvents );

		this.world = new phys.world( new phys.vec2(0, 0), true );    // physics world to contain sim		
		this._spawnWorldCallback();
		return this.doStateInitTask;
	};

	GameFramework.prototype.doStateInitTask = function ( dt, inputEvents ){
		URFP( dt );
		URFP( inputEvents );

		this._currentFrameStartTime = new Date();
		this._lastFrameStartTime = this._currentFrameStartTime;
		this._lastInputTime = this._currentFrameStartTime;
		this._timeInPause = 0;
		this._timeElapsed = 0;
		this._inputEvents = [];
		this._physSimAcculmulator = 0;

		this._initTaskCallback();
		return this.doStateOverview;
	};

	GameFramework.prototype.doStateOverview = function ( dt, inputEvents ){
		this._drawCallback();
		this._overviewCallback( dt, inputEvents);
		if (inputEvents.length > 0) {
			// on new input, we're gonna run. fire the preagme and roll!
			this._pregameCallback();
			return this.doStateRunning;
		} else {
			return this.doStateOverview;
		}
	};

	GameFramework.prototype.doStateRunning = function ( dt, inputEvents ){
		if ( this._currentFrameStartTime -  this._lastInputTime > this.kAllowedTimeWithoutInput) {
			return this.doStatePaused;
		} else {
			this._timeElapsed += dt;
			this._drawCallback();
			this._updateCallback( dt, inputEvents );

			if ( this._loseTestCallback() ) {
				return this.doStateLost;
			}

			if ( this._winTestCallback() ) {
				return this.doStateWon;
			}

			// advance the simulation according to the number of steps we have in our DT
	        // this is an *almost correct* hack from http://gafferongames.com/game-physics/fix-your-timestep/
	        // Note that we don't try to fix temporal stuttering
	        var stepSize = 1/60;
	        this._physSimAcculmulator += dt / 1000;
	        while (this._physSimAcculmulator > stepSize) {
	            this.world.Step( stepSize, 10, 10);
	            this._physSimAcculmulator -= stepSize;
	        }
			this.world.ClearForces();

			return this.doStateRunning;	
		}		
	};

	GameFramework.prototype.doStateAbandoned = function ( dt, inputEvents  ){
		URFP( dt );
		URFP( inputEvents );

		var color = 'green';
		drawutils.drawText(300,330, 'Reloading...', 2, color, color);
		this.ending = 'aborted';	
		return this.doStateHalted;
	};

	GameFramework.prototype.doStateHalted = function ( dt, inputEvents  ) {
		URFP( dt );
		URFP( inputEvents );

		var results = this._submitResultsCallback();
		results.ending = this.ending;
		results.runtime = (this._timeElapsed/1000).toFixed(2); 

		var req = new XMLHttpRequest();
		req.open('POST', '/results', true);		
		// req.onreadystatechange = function() { };
		req.setRequestHeader('Content-Type','application/json');
		req.send( JSON.stringify( results ) );

		// 1. display plot in a colorbox
        // 2. display buttons for Play Again, all results, task list
        // 3. display: 'you have completed x of 4 tasks.  Play again!' <or> 'Level cleared -- you may play again to increase your score'
        var c = $('.canvas');
        $.get('/results/'+this.taskName+'?download=json', function( rawData ) {
        	var data = rawData;
            
            // draw white  box to to give a background for plot            
            drawutils.drawRect(300,300, 590,590, 'white');//rgba(200, 200, 200, 0.8)');
            
            // at this point, we do not reschedule, and the task ends.
            resultutils.plot(c, this.xAxisLabel, this.pretyTaskName, data.results, []);
            $('.span8').append('<button class="btn btn-success play-again-button" style="position: relative; left: 100px; top: -110px;" onclick="location.reload(true);"><h3>Play again!</h3></button>');
        

        	/*
        	Draw stars 

        	var numMyResults = 3; //FIXFIX
            var numPres = numMyResults;            
            var maxstars = 5;
            var imgsize = '25';
            var strImage;
            if(numPres > 5) { 
                strImage = '/assets/soft_edge_yellow_star.png';
                $('.span8').append('<img src="'+strImage+'" width="'+imgsize+'" height="'+imgsize+'" style="position: relative; left: 120px; top: -110px;"><h3 style="position: relative; left: 145px; top: -175px;">x'+numPres+'</h3>');            
            } else {
                for( var i = 0; i<maxstars; i++){
                    strImage = '/assets/soft_edge_empty_star.png';
                    if( numPres > i) {
                        strImage = '/assets/soft_edge_yellow_star.png';
                    }
                    $('.span8').append('<img src="'+strImage+'" width="'+imgsize+'" height="'+imgsize+'" style="position: relative; left: 120px; top: -110px;">');
                }
            }
            */

            /*
            // Add button for next task
	        var k =_.keys(swarmcontrol.prettyTaskNames);
	        var nextTask = k.indexOf(currTaskName) + 1;
	        if(nextTask >= k.length) {
	            nextTask = 0;
	        }
	        newTaskPath = 'parent.location='./' + k[nextTask] + ''';
	        console.log(newTaskPath);

	        $('.span8').append('<button class='btn btn-success next-Task-button' style='position: relative; left: 140px; top: -110px;' onclick='+newTaskPath+'>► Next Task</button>');
	        */
        }.bind(this));
        

		return this.doStateHalted;
	};

	GameFramework.prototype.doStatePaused = function( dt, inputEvents ) {
		this._timeInPause += dt;
	
		if (this._timeInPause > this.kAllowedTimeInPause) {
			// on excessive time, move to abandoned state
			return this.doStateAbandoned;
		} else  if (inputEvents.length > 0) {
			// on new input, we're running again.
			this._timeInPause = 0;			
			return this.doStateRunning;
		} else {
			// in none of those cases, keep pausing.
			drawutils.drawRect(300,300, 590,590, 'rgba(200, 200, 200, 0.5)');
            var color = 'green';
            drawutils.drawText(300,250, 'Are you still there?  ', 2, color, color);

            var timeUntilRestart = ( this.kAllowedTimeInPause - this._timeInPause);
            drawutils.drawText(300, 290, 'Restarting in '+ (timeUntilRestart/1000).toFixed(0) +' seconds.', 2, color, color);

			return this.doStatePaused;
		}
	};

	GameFramework.prototype.doStateWon = function ( dt, inputEvents  ) {
		URFP( dt );
		URFP( inputEvents );

		this._wonCallback();
		this.ending = 'won';
		return this.doStateHalted;
	};

	GameFramework.prototype.doStateLost = function ( dt, inputEvents  ) {	
		URFP( dt );
		URFP( inputEvents );

		this._lostCallback();
		this.ending = 'lost';
		return this.doStateHalted;
	};

	GameFramework.prototype.run = function () {
		this._lastFrameStartTime = this._currentFrameStartTime;
		this._currentFrameStartTime = new Date();
		var dt = this._currentFrameStartTime - this._lastFrameStartTime;

		this._currentState = this._currentState(dt, this._inputEvents);

		this._inputEvents = [];
		if (this._currentState !== this.doStateHalted){
			window.requestAnimationFrame( this.run.bind(this) );
		} else {
			this.doStateHalted();
		}
	};

	GameFramework.prototype.handleInput = function( evt ){
		this._inputEvents.push(evt);
	};

	GameFramework.prototype.init = function( $canvas ) {
		this.mobileUserAgent =( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );

		drawutils.init($('#canvas'));

		this._$canvas = $canvas;
		this.useKeyboard = false; // updated as soon as keyboard events occur

		//$canvas.on('keyup', function _handleKeyUp(evt) {
		$(document).on('keyup', function _handleKeyUp(evt) {
			this._lastInputTime = new Date();
			this.useKeyboard = true;
			this._inputEvents.push( {
				type: 'keyup',
				key: evt.which
			});
		}.bind(this));

		//$canvas.on('keydown', function _handleKeyDown(evt) {
		$(document).on('keydown', function _handleKeyDown(evt) {
			this._lastInputTime = new Date();
			this.useKeyboard = true;
			this._inputEvents.push( {
				type: 'keydown',
				key: evt.which
			});
		}.bind(this));

		$canvas.on('mousedown', function _handleMouseDown(evt){
			this._lastInputTime = new Date();
			evt.preventDefault();
			
			this._inputEvents.push({
				type: 'mousedown'
			});
		}.bind(this));

		$canvas.on('mousemove', function _handleMouseMove(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			
			var rect = evt.target.getBoundingClientRect();
			var left = evt.clientX - rect.left;
			var top = evt.clientY - rect.top;

            // these are the mouse coordinates in normalized [0,1] canvas space
            var u = left / evt.target.width;
            var v = top / evt.target.height;

            // these are the mouse coordinates in world space
            var mX = 20 * left/evt.target.width;
            var mY = 20 * top/evt.target.height; // -2

			this._inputEvents.push( {
				type: 'mousemove',
				x: mX,
				y: mY,
				u: u,
				v: v, 
			});
		}.bind(this));

		$canvas.on('mouseup', function _handleMouseUp(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			
			this._inputEvents.push({
				type: 'mouseup'
			});
		}.bind(this));

		$canvas.on('touchmove',  function _handleTouchMove(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			
			var rect = evt.target.getBoundingClientRect();
			var touch = evt.touches[0];
			var left = touch.clientX - rect.left;
			var top = touch.clientY - rect.top;

            // these are the mouse coordinates in normalized [0,1] canvas space
            var u = left / evt.target.width;
            var v = top / evt.target.height;

            // these are the mouse coordinates in world space
            var mX = 20 * left/evt.target.width;
            var mY = 20 * top/evt.target.height; // -2

			this._inputEvents.push( {
				type: 'mousemove',
				x: mX,
				y: mY,
				u: u,
				v: v, 
			});

        }.bind(this));

        $canvas.on('touchstart', function _handleTouchStart(evt){
        	this._lastInputTime = new Date();
			evt.preventDefault();
			
			// we treat touch starts as mouse downs
			this._inputEvents.push({
				type: 'mousedown'
			});
        }.bind(this));

        $canvas.on('touchend',  function _functionTouchEnd(evt) {
        	this._lastInputTime = new Date();
			evt.preventDefault();

			// we treat touch ends as mouse ups
			this._inputEvents.push({
				type: 'mouseup'
			});
        }.bind(this) );

        this.tiltX = 0; // -1 left, 0 none, 1 right
        this.tiltY = 0; // -1 down, 0 none, 1 up

        $(window).on('deviceorientation', function _functionOrientationChange(evt){
        	this._lastInputTime = new Date();
			evt.preventDefault();

            var yval = -evt.beta;  // In degree in the range [-180,180]
            var xval = -evt.gamma; // In degree in the range [-90,90]

            if( !this.useKeyboard ){
                //property may change. A value of 0 means portrait view, 
                if( window.orientation === -90)
                {   //-90 means a the device is landscape rotated to the right,
                    yval = -evt.gamma;
                    xval = evt.beta; 
                }else if( window.orientation === 90)
                {   //and 90 means the device is landscape rotated to the left.
                    yval = evt.gamma;
                    xval =-evt.beta; 
                }else if( window.orientation === 180)
                {   //and 90 means the device is landscape rotated to the left.
                    yval = evt.beta;
                    xval = evt.gamma; 
                }
                 
                // simple control that maps tilt to keypad values.
                var thresh = 5;
                //{thresh = 15;}

                var newTiltX = 0; // -1 left, 0 none, 1 right
                var newTiltY = 0; // -1 down, 0 none, 1 up

                if ( Math.abs(xval) > thresh) {
                	newTiltX = ( xval > 0 ) ? 1 : -1;
                }

                if ( Math.abs(yval) > thresh) {
                	newTiltY = ( yval > 0 ) ? 1 : -1;
                }                

                // resolve events
                if (newTiltX !== this.tiltX) {
                	// send emulated keyup
                	switch( this.tiltX ) {
                		case -1: this._inputEvents.push( { type: 'keyup', key: this.constants.keys.LEFT }); break;
                		case 0: break;
                		case 1: this._inputEvents.push( { type: 'keyup', key: this.constants.keys.RIGHT }); break;
                	}

                	// send emulated keydown
                	switch( newTiltX ) {
                		case -1: this._inputEvents.push( { type: 'keydown', key: this.constants.keys.LEFT }); break;
                		case 0: break;
                		case 1: this._inputEvents.push( { type: 'keydown', key: this.constants.keys.RIGHT }); break;
                	}

                	this.tiltX = newTiltX;
                }
                if (newTiltY !== this.tiltY) {
                	// send emulated keyup
                	switch( this.tiltY ) {
                		case -1: this._inputEvents.push( { type: 'keyup', key: this.constants.keys.DOWN }); break;
                		case 0: break;
                		case 1: this._inputEvents.push( { type: 'keyup', key: this.constants.keys.UP }); break;
                	}

                	// send emulated keydown
                	switch( newTiltY ) {
                		case -1: this._inputEvents.push( { type: 'keydown', key: this.constants.keys.DOWN }); break;
                		case 0: break;
                		case 1: this._inputEvents.push( { type: 'keydown', key: this.constants.keys.UP }); break;
                	}

                	this.tiltY = newTiltY;
                }
            }
        }.bind(this));
	};

	window.GameFramework = window.GameFramework || GameFramework;
})(window.Box2D, window.$, window.drawutils, window.phys, window.resultutils);