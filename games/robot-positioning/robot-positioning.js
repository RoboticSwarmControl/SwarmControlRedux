/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(Box2D);

    var game = new GameFramework();

    game.setSpawnWorldCallback( function () {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};
        this.task.numRobots = Math.floor((Math.random()*10)+1);   // number of robots
        this.task.robots = [];
        this.task.goals = [];
        this.task.blocks = [];

        // fixture definition for obstacles
        var fixDef = new phys.fixtureDef();
        fixDef.density = 1.0;
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

        // create shaping block
        bodyDef.position.Set(10,10);
        fixDef.shape.SetAsBox(0.5,0.5);
        this.world.CreateBody(bodyDef).CreateFixture(fixDef);

        //create some robots        
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'robot';
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        fixDef.shape = new phys.circleShape( 0.5 ); // radius .5 robots
        var rowLength = 3;
        for(var i = 0; i < this.task.numRobots; ++i) {
            bodyDef.position.x = (i%rowLength)*2.1*0.5 + 12;
            bodyDef.position.y = Math.floor(i/rowLength)-2.1*0.5 + 8;
            this.task.robots[i] = this.world.CreateBody(bodyDef);
            this.task.robots[i].CreateFixture(fixDef);
            this.task.robots[i].m_angularDamping = 10;
            this.task.robots[i].m_linearDamping = 10;
            this.task.robots[i].atGoal = false;
        }
    });

    game.setInitTaskCallback( function() {
        this.task.goalsX = [8,7,9,7,8,9,7,9,7,9];                 // x-coord of goals
        this.task.goalsY = [6,7,7,8,8,8,9,9,6,6];                 // y-coord of goals
        this.task.impulse = 50;
        this.impulseV = new phys.vec2(0,0);
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        this.impulseStart = null;        
    });

    game.setDrawCallback( function() {
        drawutils.clearCanvas();
        var colorGoal;
            
        // draw goals 
        for (var i = 0; i < this.task.numRobots; i++) {
            colorGoal = this.constants.colorGoal;                
            // draw the goal positions
            // the 30s we see scattered through here are canvas scaling factor -- crertel
            drawutils.drawCircle(30*this.task.goalsX[i],
                                30*this.task.goalsY[i],
                                30*0.5,
                                colorGoal,
                                this.constants.strokeWidth);
        }

        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext())
        {
            var angle = b.GetAngle()*(180/Math.PI);
            var pos = b.GetPosition();
            var color = this.constants.colorGoal;
            for(var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (b.GetUserData() === 'robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();                        
                    if (b.atGoal === true ) {
                        drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobotAtGoal,this.constants.colorRobotEdge);
                    } else {
                        drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge);
                    }
                } else {
                    // draw the obstacles
                    var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    if(b.GetUserData() === 'obstacle') {
                        color = this.constants.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
                }
            }
        }
    });

    game.setOverviewCallback( function() {
        var color;

        // draw goal zone
        this.task.goals.forEach( function (g) { 
            var pos = g.GetPosition();
            var color = this.constants.colorRobot;
            drawutils.drawText(30*pos.x,30*pos.y,'Goal', 2, color, color);
        }.bind(this));
        this.task.blocks.forEach( function (g) { 
            var pos = g.GetPosition();
            var color = 'white';
            drawutils.drawText(30*pos.x,30*pos.y,'Object', 1.5, color, color);
        }.bind(this));

        var meanx = 0;
        var miny =  Number.MAX_VALUE;
        var meany = 0;
        for(var i = 0; i < this.task.numRobots; ++i) {
            var pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
            if( pos.y < miny)
                {miny = pos.y;}
        }
        color = this.constants.colorRobot;
        var strRobots = 'Robots';
        var strGoals = 'Goals';
        if(this.task.numRobots === 1){
            strRobots = 'Robot';
            strGoals = 'Goal';
        }
        drawutils.drawText(30*(meanx),30*(miny-1),strRobots, 1.5, color, color);
        color = this.constants.colorGoal;
        drawutils.drawText(30*(this.task.goalsX[0]),30*(this.task.goalsY[0]-1),strGoals, 1.5, color, color);
        color = this.constants.colorObstacle;
        drawutils.drawText(30*12.5,30*10,'←Obstacle', 1.5, color, color);
        color = this.constants.colorGoal;
        var strRobotGoal = this.task.numRobots + ' robots (blue) to goals (outlined)';
        if( this.task.numRobots === 1)
            { strRobotGoal = 'robot (blue) to goal (outlined)';}
        this.instructions = 'Move ' + strRobotGoal;

        drawutils.drawText(300,430,this.instructions, 1.5, color, color);
        if(this.mobileUserAgent){
              drawutils.drawText(300,460,'by tilting screen (←,↑,↓,→)', 1.5, color, color);
        }else{drawutils.drawText(300,460,'using arrow keys (←,↑,↓,→)', 1.5, color, color);}
    });

    game.setUpdateCallback( function (dt, inputs) {
        URFP(dt);

        // if no keys are up, turn off impulse
        if (!(this.keyUp || this.keyDown || this.keyLeft || this.keyRight)) {
            this.impulseStart = null;
        }

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

        // if impulse was off and any key is down, note the start time
        if ( this.impulseStart === null &&
            (this.keyUp || this.keyDown || this.keyLeft || this.keyRight)) {
            this.impulseStart = Date.now();
        }

        var maxImpTime = 1.0; //seconds to maximum impulse (without it, you can overshoot the goal position)
        var timeInImpulse = Date.now() - this.impulseStart;
        this.impulseV.x = 0;
        this.impulseV.y = 0;
        
        if (this.keyDown) {
            this.impulseV.y -= this.task.impulse * Math.min( 1, 0.001 * ( timeInImpulse/maxImpTime));
        }
        if (this.keyUp) {
            this.impulseV.y += this.task.impulse * Math.min( 1, 0.001 * ( timeInImpulse/maxImpTime));   
        }
        if (this.keyLeft) {
            this.impulseV.x -= this.task.impulse * Math.min( 1, 0.001 * ( timeInImpulse/maxImpTime));
        }
        if (this.keyRight) {
            this.impulseV.x += this.task.impulse * Math.min( 1, 0.001 * ( timeInImpulse/maxImpTime));
        }

        // moving at diagonal is no faster than moving sideways or up/down
        var normalizer = Math.min(1,this.task.impulse/Math.sqrt(this.impulseV.x*this.impulseV.x + this.impulseV.y*this.impulseV.y));
        this.impulseV.x *=  normalizer;    
        this.impulseV.y *=  normalizer;   

        // apply the user force to all the robots
        this.task.robots.forEach( function(r) { 
            r.ApplyForce( this.impulseV, r.GetWorldPoint( this.constants.zeroRef ) );
        }.bind(this) );

        // find the robot positions.
        this.task.robots.forEach( function(r) {
            var roboPosition = r.GetPosition();
            r.atGoal = false;
            for ( var i = 0; i <  this.task.goalsX.length; i++ ) {
                if( mathutils.lineDistance( this.task.goalsX[i],
                                        this.task.goalsY[i],
                                        roboPosition.x, 
                                        roboPosition.y) < 0.5) {                
                r.atGoal = true;
                }
            }
            
        }.bind(this));
    });

    game.setWinTestCallback( function() {
        var robotsAtGoal = 0;

        this.task.robots.forEach( function(r) {
            var roboPosition = r.GetPosition();
            for ( var  i = 0; i < this.task.goalsX.length; i++ ){
                if( mathutils.lineDistance( this.task.goalsX[i],
                                            this.task.goalsY[i],
                                            roboPosition.x,
                                            roboPosition.y) < 0.5) {
                    robotsAtGoal++;
                }
            }
        }.bind(this));

        // we're done if all robots are on the goals
        return robotsAtGoal === this.task.numRobots;

    });

    game.setLoseTestCallback( function() {
        // in this game, we can't lose--no time constraints or anything.
        return false;
    });

    game.setLostCallback( function() {
        // nothing to do on lose.
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
            task: 'robot-positioning',
            mode: 'default'
        };
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
}