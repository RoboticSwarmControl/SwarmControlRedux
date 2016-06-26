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

			- "won"		: Terminal state. The game has finished and the player has won.

			- "lost"	: Terminal state. The game has finished and player has lost (failure or timeout).

			- "abandoned" : Terminal state. Game has not received input and will stop.
		*/

		this._currentState = this.doStateOverview;
		this._currentFrameStartTime = new Date();
		this._lastFrameStartTime = this._currentFrameStartTime;
		this._timeInPause = 0;
		this._inputEvents = [];

		this.kAllowedTimeInPause = 30*1000; // 30 secs in pause before moving on
		
		this._overviewCallback = function () { };
		this._updateCallback = function () { };
		this._winTestCallback = function () { return false; };
		this._loseTestCallback = function () { return false; };		
	};	

	GameFramework.prototype.setOverviewFunction = function ( overviewFunctionCb ) {
		this._overviewCallback = overviewFunctionCb;
	};

	GameFramework.prototype.setUpdateCallback = function ( updateFunctionCb ) {
		this._updateCallback = updateFunctionCb;
	};

	GameFramework.prototype.setWinTestCallback = function ( winTestCallback ) {
		this._winTestCallback = winTestCallback;
	};

	GameFramework.prototype.setLoseTestCallback = function ( lostTestCallback ) {
		this._loseTestCallback = lostTestCallback;
	};

	GameFramework.prototype.doStateOverview = function ( dt, inputEvents ){
		console.log("overview");
		if (inputEvents.length > 0) {
			// on new input, we're running again.
			return this.doStateRunning;
		} else {
			return this.doStateOverview;
		}
	};

	GameFramework.prototype.doStateRunning = function ( dt, inputEvents ){
		console.log("running");

		this._updateCallback();

		// run 

		// step bodies

		return this.doStateRunning;
	};

	GameFramework.prototype.doStateAbandoned = function ( dt, inputEvents  ){
		console.log("abandoned");
		/* do abandoned screen */

		return this.doStateHalted;
	};

	GameFramework.prototype.doStateHalted = function ( dt, inputEvents  ) {
		console.log("halted");

		return this.doStateHalted;
	};

	GameFramework.prototype.doStatePaused = function( dt, inputEvents ) {		
		console.log("paused");

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
			return this.doStatePaused;
		}
	};

	GameFramework.prototype.doStateWon = function ( dt, inputEvents  ) {
		console.log("won");
		this._winTestCallback();
		return this.doStateHalted;
	};

	GameFramework.prototype.doStateLost = function ( dt, inputEvents  ) {	
		console.log("lost");
		this._loseTestCallback();
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
		}
	};

	GameFramework.prototype.init = function( $canvas ) {
		this._$canvas = $canvas;

		$canvas[0].on('keyup', function(e){
		}, false);

		$canvas[0].on('keydown', function(e){
		}, false);

		$canvas[0].on('mousedown', function(e){
		}, false);

		$canvas[0].on('mousemove', function(e){
		}, false);

		$canvas[0].on('mouseup', function(e){
		}, false);

		$canvas[0].on('touchmove', function(e){
			/*
            e.preventDefault();
            var rect = this.getBoundingClientRect();
            var touch = e.touches[0];
            var left = touch.pageX - rect.left - this.clientLeft + this.scrollLeft;
            var top = touch.pageY - rect.top - this.clientTop + this.scrollTop;

            that._mX = 20 * left/this.width;
            that._mY = 20 * top/this.height -2; //
            */
        }, false);        

        $canvas[0].on('touchstart', function(e) {
        	/*
            that._attracting = true;
            //check if this is the first valid keypress, if so, starts the timer
            if( that._startTime == null )
            { 
                that.lastUserInteraction = new Date().getTime();
                that._startTime = that.lastUserInteraction;
                that._runtime = 0.0;
            }
            */
        }, false);

        $canvas[0].on('touchend', function (e) {
        	/*
            that.lastUserInteraction = new Date().getTime();
            that._attracting = false;
            */
        }, false);
	};

	window.GameFramework = window.GameFramework || GameFramework;

})(Box2D, $);