# SwarmControlRedux

[![Build Status](https://travis-ci.org/RoboticSwarmControl/SwarmControlRedux.svg?branch=master)](https://travis-ci.org/RoboticSwarmControl/SwarmControlRedux)

This is the Node reimplementation of the [SwarmControl](http://www.swarmcontrol.net/) website.

## Installation

First, you'll need to make sure that you've got NodeJS 5.10.0 [from here](https://nodejs.org/en/blog/release/v0.5.10/), or [here](https://nodejs.org/dist/latest-v5.x/) for Mac OS.

Next, you'll need to download the repo:

```
$ git clone https://github.com/RoboticSwarmControl/SwarmControlRedux.git
```

Then, you need to install the application, go to the folder you have cloned, and install:

```
$ npm install
```

After, you need to build the client resources. This will copy around the vendor scripts and compile the games.

This is also when linting will occur.

```
$ npm run-script build
```

Lastly, run the application.

```
$ npm start
```

## Useful scripts

There are several scripts that are setup that can help during development. All can be used by invoking `npm run-script $script_name`, with the desired script name in place of `$script_name`.

Script name | Function | When to use
------------|----------|-------------
build 		| Builds client styles, scripts, and games | Every time changes are made to game or client code, or at first install.
build-no-lint | Runs a full build, without linting.		| Run manually to build in presnce of linting errors. This is helpful when refactoring games.
clean 		| Cleans client styles, scripts, and games. | Invoked during build. Can be run manually to fix weirdness.
lint        | Lints (checks for scripting errors) server, client, and game scripts. | Invoked during build. Can be run manually to check for syntax errors--very helpful.
lint:games	| Lints (checks for scripting errors) just game scripts. | Can be run manually to check for syntax errors in games--very helpful during game development.
start		| Starts the server.	| Used to start the server.

## Creating new games

To create a new game, create a directory under the `/games` folder.

The folder should be named all lowercase with hypens between words. For the sake of illustration, we'll pretend that that game here is going to be "The Example Game". We'll abbreviate the folder name to `example-game`.

Inside the folder, you'll need to have a few files:

File | Function
-----|------------
`example-game/example-game.js` | Javascript file descrbing the game. This will be what is loaded in the browser. Note that it has the same name as the folder and as the script name in the manifest file.
`example-game/preview.png` | The image that will be displayed on the task index page. This will be shown to the user.
`example-game/instructions.html.ejs` | The HTML markup for the instructions section.
`example-game/science.html.ejs` | The HTML markup for the science section.
`example-game/manifest.json` | JSON manifest describing the game.


### manifest.json


The `manifest.json` file is used by the system to mount and setup a coouple of things in the game. It sets some cosmetic details.

For our example, it looks like:

```
{
	"name" : "example-game",
	"xAxisLabel" : "Number of robots",
	"displayName": "The Example Game"
}
```

The `name` string is the short name of the game, same as the folder name and game script filename (sans extension). It is how the game will appear in URLs, how the system internally recognizes things, and how the results will be tagged in the database.

The `xAxisLabel` string is the legend that will be displayed on the graph at the end of the game.

The `displayName` string is the pretty name that will be shown on the task index page and on the title for the page.

### instructions.html.ejs

This file is used to populate the instructions section in the sidebar.

In our example:

```
<h2> How To Play </h2>

<p>
	This is where we'd list the HTML for the game.
</p>
```

### science.html.ejs

This file is used to populate the science section in the sidebar.

In our example:

```
<h2> The Science </h2>

<p>
	This is where we'd put the science information
</p>
```

### preview.png

A pretty picture of the game. Displayed to users.

It helps to make a screenshot that shows the game mid-task, so it gives a clearer idea of what's going on to a user.


### example-game.js

The actual game that the user will run.

In our example:

```
/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }
    
    var game = new GameFramework();

    game.setPregameCallback( function() {
        /*
            This function is called between the overview and the game updates.
            This is helpful for disabling buttons and other UI elements.
        */
    });

    game.setSpawnWorldCallback( function () {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};
        this.task.robots = [];          // array of bodies representing the robots
        this.task.goals = [];           // array of goals of form {x,y,w,h}
        this.task.blocks = [];          // array of bodies representing blocks

        /*
            This function is where you'd create all the bodies in the world, workpieces and robots and such.

            Positioning of those needs to occur in the init task callback, so they can be reset between games.
        */
    });

    game.setInitTaskCallback( function () {
        this.mX = 0;
        this.mY = 0;
        this.impulseV = new phys.vec2(0,0);

        /*
            This function is where you would setup click handlers and move everything to its starting position.
        */
    });

    game.setDrawCallback( function () {
        /*
            This function is called to render the state of the game.
        */

        // clear the canvas
        drawutils.clearCanvas();

        /*
            Here we'd draw the robot bodies, goals, input labels, and so on.
        */
    });


    game.setOverviewCallback( function() {
        /*
            This function is called after the draw callback.

            Done in the overview state, code here displays the game overview to the user.
            This is where you'd do things like label robot positions, show goals, and so on.
        */
    });

    game.setUpdateCallback( function (dt, inputs) {
        /*
            This function is called to digest user input and apply forces to robots.
        */

        // this is just example code for digesting the inputs
        inputs.forEach( function( evt ) {
            switch (evt.type) {
                case 'mousedown': this.controllerActive = true; break;
                case 'mouseup' : this.controllerActive = false; break;
                case 'mousemove' :  this.mX = evt.x;
                                    this.mY = evt.y;
                                    break;
            }
        }.bind(this));

        /*
            After digesting the events, the task has updated controller states.
            Then, impulses are applied to robots. The framework will handle
            actually stepping the simulation with the correct timesteps.
        */
    });

    game.setWinTestCallback( function() {
        /*
            This function is called to check if a game is won on a frame.
            Returns 'false' if a win hasn't occurred, 'true' if it has.

            This is used to check for objects being in the correct position,
            robots being in the right configuration, and so forth.
        */
        return false;
    });

    game.setLoseTestCallback( function() {
        /*
            This function is called to check if a game is lost on a frame.
            Returns 'false' if loss hasn't occurred, 'true' if it has.

            This is used to impose things like time limits.
        */
        return false;
    });

    game.setLostCallback( function() {
        /*
            This function is called when a user loses.
        */
    });

    game.setWonCallback( function() {
        /*
            This function is called when a user wins.
        */
        drawutils.drawRect(300,300, 590,590, 'rgba(200, 200, 200, 0.5)');
        var color = 'green';
        drawutils.drawText(300,250, 'You finished in '+ (this._timeElapsed/1000).toFixed(2) +' seconds!', 2, color, color);
        drawutils.drawText(300,350, 'Loading results page...', 2, color, color);

         // next, post our results to the server.
         /* things happen */ 
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
}
```
