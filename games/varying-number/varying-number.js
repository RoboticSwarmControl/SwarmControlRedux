/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    var game = new GameFramework('varying-number', 'Varying Number','Number of robots');
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(mathutils);

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};
        this.task.numRobots = Math.floor((Math.random()*500)+1);          // number of robots
        this.task.robotRadius = 0.5*4.0/Math.sqrt(this.task.numRobots);
        this.task.robots = [];              // array of bodies representing the robots
        this.task.goals = [];               // array of goals of form {x,y,w,h}
        this.task.blocks = [];              // array of bodies representing blocks

        var i;
        var fixDef = new phys.fixtureDef();
        fixDef.density = 10.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value

        // body definition for obstacles
        var bodyDef = new phys.bodyDef();
        bodyDef.userData = 'obstacle';
        bodyDef.type = phys.body.b2_staticBody;

        //create ground obstacles
        fixDef.shape = new phys.polyShape();

        // create bottom wall
        phys.makeBox(    this.world,
                    10, 20 - this.constants.obsThick,
                    10, this.constants.obsThick);

        // create top wall
        phys.makeBox(    this.world,
                    10, this.constants.obsThick,
                    10, this.constants.obsThick);
        
        // create left wall
        phys.makeBox(    this.world,
                    this.constants.obsThick, 10,
                    this.constants.obsThick, 10);

        // create right wall
        phys.makeBox(    this.world,
                    20 - this.constants.obsThick, 10,
                    this.constants.obsThick, 10);

        // create mid lower wall    
        phys.makeBox(    this.world,
                    25, 6.66,
                    20, this.constants.obsThick);

        // create mid upper wall
        phys.makeBox(    this.world,
                    -5, 13.33,
                    20, this.constants.obsThick);
        
        // create block
        this.task.blocks.push( phys.makeHexagon(this.world, 10, 16.5, 'workpiece'));

        // create the goal
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        bodyDef.position.Set(17,3.35);
        this.task.goals.push( this.world.CreateBody(bodyDef) );
        fixDef.isSensor = true;
        fixDef.shape = new phys.circleShape(3); 
        this.task.goals[0].CreateFixture(fixDef);

        // create some robots
        var rowLength = Math.floor(7/(2*this.task.robotRadius));
        var xoffset = this.task.robotRadius+0.5;
        var yoffset = 14+this.task.robotRadius;

        for(i = 0; i < this.task.numRobots; ++i) {
            this.task.robots.push( phys.makeRobot(  this.world,
                                                    (i%rowLength)*2.1*this.task.robotRadius + xoffset,
                                                    Math.floor(i/rowLength)*2.1*this.task.robotRadius + yoffset,
                                                    this.task.robotRadius,
                                                    'robot'));
        }
    });

    game.setInitTaskCallback( function() {
        this.task.impulse = 20;             // impulse to move robots by
        this.impulseV = new phys.vec2(0,0); // global impulse to control all robots

        $('#task-mode-count').html(this.task.numRobots);
    });

    game.setDrawCallback( function() {
        drawutils.clearCanvas();

        // draw goal zone
        this.task.goals.forEach( function (g) { 
            var f = g.GetFixtureList();
            var radius = f.GetShape().GetRadius();
            var pos = g.GetPosition();
            drawutils.drawCircle( 30*pos.x, 30*pos.y,30*radius, this.constants.colorGoal, this.constants.strokeWidth );
        }.bind(this));

        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext())
        {
            var angle = b.GetAngle()*(180/Math.PI);
            var pos = b.GetPosition();
            var X;
            var Y;
            var color;

            for (var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (b.GetUserData() === 'goal') {
                    continue; // we drew the goal earlier
                }
                if (b.GetUserData() === 'robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                } else if (b.GetUserData() === 'workpiece') {
                    // draw the pushable object
                    X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;

                    color = this.constants.colorObject;
                    //drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color,angle);
                    drawutils.drawPolygon(30*pos.x, 30*pos.y,30*2,6,angle,color);
                } else {
                    //http://calebevans.me/projects/jcanvas/docs/polygons/
                    // draw the obstacles
                    X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    color = this.constants.colorGoal;
                    if(b.GetUserData() === 'obstacle') {
                        color = this.constants.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
                }
            }
        }

        // draw goal zone
        this.task.goals.forEach( function (g) { 
            var pos = g.GetPosition();
            color = this.constants.colorGoal;
            drawutils.drawText(30*pos.x,30*pos.y,'Goal', 1.5, color, color);
        }.bind(this));
    });

    game.setOverviewCallback( function() {
        var color = 'white';

        //draw arrow from object to goal
        var pGoalArrow = [[400,495],[525,495],[525,300],[80,300],[80,100],[400,100]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoal,false,50,true);
        var aY = 20;
        var aX = 50;
        pGoalArrow = [[400-aX,100+aY],[400,100],[400-aX,100-aY]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoal,false,50,false);
        // (←,↑,↓,→)
        if(this.mobileUserAgent){
              drawutils.drawText(300,300,'tilt screen to move object to goal', 1.5, 'white', 'white');
        }else{drawutils.drawText(300,300,'move object to goal with arrow keys', 1.5, 'white', 'white');}

        this.task.blocks.forEach( function (g) { 
            var pos = g.GetPosition();
            color = 'white';
            drawutils.drawText(30*pos.x,30*pos.y,'Object', 1.5, color, color);
        }.bind(this));

        var meanx = 0;
        var meany = 0;
        for(var i = 0; i < this.task.numRobots; ++i) {
            var pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this._numrobots;
            meany = meany + pos.y/this._numrobots;
        }
        color = this.constants.colorRobot;
        drawutils.drawRect(30*meanx,30*(meany+2), 120,30, 'rgba(240, 240, 240, 0.7)');
        drawutils.drawText(30*meanx,30*(meany+2),this.task.numRobots+' Robots', 1.5, color, color);
    });

    game.setUpdateCallback( function (dt, inputs) {
        URFP(dt);

        inputs.forEach( function( evt ) {
            //HACKHACK
            // Note that this impulse needs to be reset *erry frame*
            // or the bots give up and go away
            if (evt.type === 'keydown') {
                switch( evt.key ) {
                    case 37 : this.keyLeft = true; break;
                    case 39 : this.keyRight = true; break;
                    case 38 : this.keyDown = true; break;
                    case 40 : this.keyUp = true; break;
                    case 65 : this.keyLeft = true; break;
                    case 68 : this.keyRight = true; break;
                    case 87 : this.keyDown = true; break;
                    case 83 : this.keyUp = true; break;
                }
            } else if (evt.type === 'keyup') {
                switch( evt.key ) {
                    case 37 : this.keyLeft = false; break;
                    case 39 : this.keyRight = false; break;
                    case 38 : this.keyDown = false; break;
                    case 40 : this.keyUp = false; break;
                    case 65 : this.keyLeft = false; break;
                    case 68 : this.keyRight = false; break;
                    case 87 : this.keyDown = false; break;
                    case 83 : this.keyUp = false; break;
                }
            }
        }.bind(this));

        this.impulseV.y = this.impulseV.x = 0;
        if (this.keyUp) {
            this.impulseV.y = this.task.impulse;
        }
        if (this.keyDown) {
            this.impulseV.y = -this.task.impulse;   
        }
        if (this.keyLeft) {
            this.impulseV.x = -this.task.impulse;
        }
        if (this.keyRight) {
            this.impulseV.x = this.task.impulse;
        }


        // moving at diagonal is no faster than moving sideways or up/down
        var normalizer = Math.min(1 , this.task.impulse/Math.sqrt(this.impulseV.x*this.impulseV.x + this.impulseV.y*this.impulseV.y));
        var forceScaler = normalizer*(this.task.robotRadius*0.5)/0.25;   
        //scale by robot size -- now scale by robot diameter (500 robots was SLOW).  These means we hose the first 26 results (bummer)
        this.impulseV.x *=  forceScaler;    
        this.impulseV.y *=  forceScaler;  
        // apply the user force to all the robots
        this.task.robots.forEach( function(r) { 
            r.ApplyForce( this.impulseV, r.GetWorldPoint( this.constants.zeroRef ) );
        }.bind(this) );

    });

    game.setLoseTestCallback( function() {
        // in this game, we can't lose--no time constraints or anything.
        return false;
    });

    game.setLostCallback( function() {
        // nothing to do on lose.
    });

    game.setWinTestCallback( function() {
        var ret = true;
        // need to check if object has been moved into the goal zone
        this.task.blocks.forEach( function (b) {
            // we use _.every because it will stop iterating on success
            this.task.goals.every( function (g) {
                ret = g.GetFixtureList().GetAABB().Contains( b.GetFixtureList().GetAABB() );
                return !ret;
            }.bind(this));
        }.bind(this));
        
        return ret;
    });

    game.setWonCallback( function() {
        //congratulate
        drawutils.drawRect(300,300, 590,590, 'rgba(200, 200, 200, 0.5)');
        var color = 'green';
        drawutils.drawText(300,250, 'You finished in '+ (this._timeElapsed/1000).toFixed(2) +' seconds!', 2, color, color);
        drawutils.drawText(300,350, 'Loading results page...', 2, color, color);
    });

    game.setResultsCallback( function() {
        return {
            numRobots: this.task.numRobots,
            task: 'varying-number',
            mode: 'default'
        };
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
}