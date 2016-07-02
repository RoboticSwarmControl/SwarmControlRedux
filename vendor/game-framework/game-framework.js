/*
	game-framework.js -- Supporting framework for the swarm control games.

	This framework is meant to give a unified interface for handling rendering, game lifecycle, and  so forth.
*/

(function _setupGameFramework( box2D, jQuery ) {

	function GameFramework() {

		/*
			A game exists in one of the following states:

			- "overview" : The game is showing it's instruction diagram.
							Any input moves it to "running".
			- "running" : The game is running the simulation and accepting input.
							If no input has occurred in some time, game moves to "paused" state.
							If game is tabbed away from, game moves to "paused" state.
							If win condition met, game moves to "won" state.
							If failure condition met, game moves to "lost" state.
							By default, game moves to "running" state.

			- "paused" : The game is asking the user if they've got input or have forgotten about it.
							If no input has occurred for some time in this state, game moves to "abandoned" state.
							If any input occurs, game is moved back to "running" state.

			- "won"		: The game has finished and the player has won.
								Game moves now to "halted" state.

			- "lost"	: The game has finished and player has lost (failure or timeout).
								Game moves now to "halted" state.

			- "abandoned" : The game has been untouched long enough that the pause state put us here. Draw a message.
								Game moves now to "halted" state.

			- "halted" : Terminal state. Application stops.
		*/

		this._currentState = this.doStateOverview;
		this._currentFrameStartTime = new Date();
		this._lastFrameStartTime = this._currentFrameStartTime;
		this._lastInputTime = this._currentFrameStartTime;
		this._timeInPause = 0;
		this._timeElapsed = 0
		this._inputEvents = [];
		this._physSimAcculmulator = 0;

		this.mobileUserAgent = false;

		this.kAllowedTimeWithoutInput = 10*1000;	// 10 seconds before we think the user has abandoned us
		this.kAllowedTimeInPause = 30*1000; // 30 secs in pause before moving on
		
		this._initCallback = function () { };
		this._overviewCallback = function () { };
		this._pregameCallback = function () { };
		this._drawCallback = function () { };
		this._updateCallback = function () { };
		this._lostCallback = function () { };
		this._wonCallback = function () { };
		this._winTestCallback = function () { return false; };
		this._loseTestCallback = function () { return false; };

		this.world = new phys.world( new phys.vec2(0, 0), true );    // physics world to contain sim


		this.constants = {};
		this.constants.zeroRef = new phys.vec2(0,0);
		this.constants.keys = {
			UP: 	38,
			DOWN: 	40,
			LEFT: 	37,
			RIGHT: 	39,
		}
		this.constants.colorRobot = "blue";
	    this.constants.colorRobotEdge = "rgb(50,50,255)";
	    this.constants.colorRobotGoal = "blue";
	    this.constants.colorRobotAtGoal = "lightblue";
	    this.constants.colorObstacle = "rgb(95,96,98)";
	    this.constants.colorGoalArrow = "rgb(0,110,0)";
	    this.constants.colorGoal = "green";  				// color of unclocked button (middle) "green",
	    this.constants.colorObject = "green";  				// color of clicked button,  "green" = 0,128,0,
	    this.constants.colorObjectEdge = "darkgreen";		// color of clicked button border "darkgreen",
	    this.constants.colorObjectAtGoal = "lightgreen";
	    this.constants.strokeWidth = 2;
	    this.constants.strokeWidthThick = 4;
	    this.constants.obsThick = 0.2;						//thickness of obstacles at edges and internally
	};	

	GameFramework.prototype.setInitCallback = function ( initFunctionCb ) {
		this._initCallback = initFunctionCb.bind(this);
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
	}

	GameFramework.prototype.setWinTestCallback = function ( winTestCallback ) {
		this._winTestCallback = winTestCallback.bind(this);
	};

	GameFramework.prototype.setLoseTestCallback = function ( lostTestCallback ) {
		this._loseTestCallback = lostTestCallback.bind(this);
	};

	GameFramework.prototype.setLostCallback = function ( lostCb) {
		this._lostCallback = lostCb;
	};

	GameFramework.prototype.setWonCallback = function( wonCb ) {
		this._wonCallback = wonCb;
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
		console.log("abandoned");
		
		var color = "green";
		drawutils.drawText(300,330, "Reloading...", 2, color, color);
		location.reload(true);

		return this.doStateHalted;
	};

	GameFramework.prototype.doStateHalted = function ( dt, inputEvents  ) {
		console.log("halted");
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
            var color = "green";
            drawutils.drawText(300,250, "Are you still there?  ", 2, color, color);

            var timeUntilRestart = ( this.kAllowedTimeInPause - this._timeInPause);
            drawutils.drawText(300, 290, "Restarting in "+ (timeUntilRestart/1000).toFixed(0) +" seconds.", 2, color, color);

			return this.doStatePaused;
		}
	};

	GameFramework.prototype.doStateWon = function ( dt, inputEvents  ) {
		console.log("won");
		this._wonCallback();
		return this.doStateHalted;
	};

	GameFramework.prototype.doStateLost = function ( dt, inputEvents  ) {	
		console.log("lost");
		this._lostCallback();
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

		drawutils.init();

		this._initCallback();

		this._$canvas = $canvas;

		console.log($canvas);

		//$canvas.on('keyup', function _handleKeyUp(evt) {
		$(document).on('keyup', function _handleKeyUp(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			evt.stopPropagation();
			this._inputEvents.push( {
				type: 'keyup',
				key: evt.keyCode
			});
		}.bind(this));

		//$canvas.on('keydown', function _handleKeyDown(evt) {
		$(document).on('keydown', function _handleKeyDown(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			evt.stopPropagation();
			this._inputEvents.push( {
				type: 'keydown',
				key: evt.keyCode
			});
		}.bind(this));

		$canvas.on('mousedown', function _handleMouseDown(evt){
			this._lastInputTime = new Date();
			evt.preventDefault();
			evt.stopPropagation();
			this._inputEvents.push({
				type: 'mousedown'
			});
		}.bind(this));

		$canvas.on('mousemove', function _handleMouseMove(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			evt.stopPropagation();
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
			evt.stopPropagation();
			this._inputEvents.push({
				type: 'mouseup'
			});
		}.bind(this));

		$canvas.on('touchmove',  function _handleTouchMove(evt) {
			this._lastInputTime = new Date();
			evt.preventDefault();
			evt.stopPropagation();

			/*
			var rect = evt.target.getBoundingClientRect();
            var touch = e.touches[0];
            var left = touch.pageX - rect.left - evt.target.clientLeft + evt.target.scrollLeft;
            var top = touch.pageY - rect.top - evt.target.clientTop + evt.target.scrollTop;

            that._mX = 20 * left/evt.target.width;
            that._mY = 20 * top/evt.target.height -2;
            */

			/*
			function(e){
			
            e.preventDefault();
            var rect = this.getBoundingClientRect();
            var touch = e.touches[0];
            var left = touch.pageX - rect.left - this.clientLeft + this.scrollLeft;
            var top = touch.pageY - rect.top - this.clientTop + this.scrollTop;

            that._mX = 20 * left/this.width;
            that._mY = 20 * top/this.height -2; //
            
        } */
        }.bind(this));

        $canvas.on('touchstart', function _handleTouchStart(evt){
        	this._lastInputTime = new Date();
        	evt.preventDefault();
			evt.stopPropagation();
        	/*
        	function(e) {
        	
            that._attracting = true;
            //check if this is the first valid keypress, if so, starts the timer
            if( that._startTime == null )
            { 
                that.lastUserInteraction = new Date().getTime();
                that._startTime = that.lastUserInteraction;
                that._runtime = 0.0;
            }           
        } */
        }.bind(this));

        $canvas.on('touchend',  function _functionTouchEnd(evt) {
        	this._lastInputTime = new Date();
        	evt.preventDefault();
			evt.stopPropagation();
		/*
        function (e) {
        	
            that.lastUserInteraction = new Date().getTime();
            that._attracting = false;
            
        }
        */        
        }.bind(this) );

        /*
        window.addEventListener('deviceorientation', function(event) {
                var yval = -event.beta;  // In degree in the range [-180,180]
                var xval = -event.gamma; // In degree in the range [-90,90]

                if( !that.useKeyboard ){
                    //property may change. A value of 0 means portrait view, 
                    if( window.orientation == -90)
                    {   //-90 means a the device is landscape rotated to the right,
                        yval = -event.gamma;
                        xval = event.beta; 
                    }else if( window.orientation == 90)
                    {   //and 90 means the device is landscape rotated to the left.
                        yval = event.gamma;
                        xval =-event.beta; 
                    }else if( window.orientation == 180)
                    {   //and 90 means the device is landscape rotated to the left.
                        yval = event.beta;
                        xval = event.gamma; 
                    }
                     
                    // simple control that maps tilt to keypad values.
                    var thresh = 5;
                    if(that._startTime == null)//bigger threshold to start
                        {thresh = 15;}
                    that.lastUserInteraction = new Date().getTime();
         
                    if( yval > thresh )
                    {   
                        that.keyD=null;
                        if(that.keyU==null){that.keyU = that.lastUserInteraction;} 
                    }else if ( yval < -thresh )
                    {   
                        that.keyU=null;
                        if(that.keyD==null){that.keyD = that.lastUserInteraction;} 
                    }else
                    {that.keyD=null; that.keyU=null;}

                    if( xval > thresh )
                    {   
                        that.keyR=null;
                        if(that.keyL==null){that.keyL = that.lastUserInteraction;} 
                    }else if ( xval < -thresh )
                    {   
                        that.keyL=null;
                        if(that.keyR==null){that.keyR = that.lastUserInteraction;} 
                    }else
                    {that.keyR=null; that.keyL=null;}
                
                    //check if this is the first valid keypress, if so, starts the timer
                    if( that._startTime == null && ( that.keyL != null || that.keyR != null || that.keyU != null || that.keyD != null))
                    { 
                        that._startTime = that.lastUserInteraction;
                        that._runtime = 0.0;
                    }
                }
            });
        */
	};

	window.GameFramework = window.GameFramework || GameFramework;
})(Box2D, $);