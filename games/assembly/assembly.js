/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    var game = new GameFramework('assembly', 'assembly','Noise (% control power)');
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(mathutils);

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};

        if(this.mobileUserAgent) {this.task.numRobots = 20;}          // number of robots
        else{this.task.numRobots = 100;}
        
        this.task.numBlocks = 2;
        this.task.robotRadius = 0.5*4.0/Math.sqrt(this.task.numRobots);
        this.task.robots = [];              // array of bodies representing the robots
        this.task.goals = [];               // array of goals of form {x,y,w,h}
        this.task.blocks = [];              // array of bodies representing blocks
        var i;
        this.task.objectposx = [];
        this.task.objectposy = [];
        this.task.counter = 0;
        this.task.colorSelected = [];
        this.task.history = {
            workpiece0: [],
            workpiece1: [],
            swarm: []
        };
        this.task.workpieceTimeSinceLastWorkpeiceUpdate = [0,0,0];
        this.task.timeInterval = 500;
        this.task.btnCycle = true;

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

        // create the goal
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        // bodyDef.position.Set(18- this.constants.obsThick-2* Math.sqrt(3)/2,3);
        bodyDef.position.Set(18.8,3);
        this.task.goals.push( this.world.CreateBody(bodyDef) );
        fixDef.isSensor = true;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        fixDef.shape.SetAsBox(Math.sqrt(3)/4, 0.8); 
        this.task.goals[0].CreateFixture(fixDef);

        // create some robots
        var xoffset = this.task.robotRadius + 0.5;
        var yoffset = 14 + this.task.robotRadius;        
        for(i = 0; i < this.task.numRobots; ++i) {
            this.task.robots.push( phys.makeRobot(  this.world,
                                                    xoffset + 7 * Math.random(),
                                                    yoffset + 5 * Math.random(),
                                                    this.task.robotRadius,
                                                    'robot'));
        }

        var generateAngle1 = Math.PI * Math.random();
        var generateAngle2 = Math.PI * Math.random();

        var startPos = [
            {x: 3, y: 3},
            {x: 3, y: 10},
            {x: 3, y: 17},
            {x: 10, y: 3},
            {x: 10, y: 10},
            {x: 10, y: 17},
            {x: 17, y: 3},
            {x: 17, y: 10},
            {x: 17, y: 17},
        ];

        for ( i = 0; i < 2; i++) {
            var k = Math.floor(startPos.length * Math.random());
            switch(i){
                case 0 : this.task.blocks.push( phys.makeMirroredBlock(this.world, startPos[k].x + Math.cos(generateAngle1 - Math.PI*1/2), startPos[k].y + Math.sin(generateAngle1 - Math.PI*1/2), 'workpiece0', generateAngle1)); break;
                default : this.task.blocks.push( phys.makeMirroredBlock(this.world, startPos[k].x + Math.cos(generateAngle2 - Math.PI*1/2), startPos[k].y + Math.sin(generateAngle2 - Math.PI*1/2), 'workpiece1', generateAngle2)); break;
            }
            startPos.splice(k, 1);
        }
    });

    game.setInitTaskCallback( function() {
        // this.task.modes = ['full-state', 'graph', 'mean & variance', 'mean'];
        // this.task.mode = this.task.modes[ Math.ceil( Math.random() * this.task.modes.length ) - 1];
        
        // this.impulseStart = null;
        // this.task.impulse = 80;
        // this.impulseV = new phys.vec2(0,0);
        // this.keyUp = false;
        // this.keyDown = false;
        // this.keyLeft = false;
        // this.keyRight = false;
        

        // $('.mode-button').prop('disabled',false);
        
        // //set the inital mode
        // var curMode = this.task.mode;
        // if( curMode === 'mean & variance') {
        //     curMode = 'mean±var';
        // }
        // $('#button-'+curMode).addClass('btn-success');
        // //add click functionality
        // this.task.modes.forEach( function (m) {
        //     var curMode = m;
        //     if( curMode === 'mean & variance') {
        //         curMode = 'mean±var';
        //     }
        //     $('#button-'+curMode).click(function() {
        //         $('.mode-button').removeClass('btn-success');
        //         $('#button-'+curMode).addClass('btn-success');
        //         this.task.mode = m;
        //         this.task.btnCycle = false;
        //     }.bind(this));
        // }.bind(this));
        this.task.noise =(10*Math.random()).toFixed(1);  //add some noise: 0.0 to 10.0        
        this.mX = 0;
        this.mY = 0;
        this.impulseV = new phys.vec2(0,0);
        this.task.impulse = 50;
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;

        $('#task-mode-power').html(this.task.noise * 10);
    });

    game.setDrawCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */
        
        drawutils.clearCanvas();

        var i;
        var pos;
        var meanx;
        var meany;
        var varx;
        var vary;
        var covxy;
        // var meanNearx = [];
        // var meanNeary = [];
        var angle;
        var X;
        var Y;
        var color;
        var verts;

        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext())
        {
            angle = b.GetAngle()*(180/Math.PI);
            var type = b.GetUserData();
            pos = b.GetPosition();
            var index;
            for (var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (type === 'goal') {
                    continue; // we drew the goal earlier
                }
                if (type ==='robot') {
                    var radius = f.GetShape().GetRadius();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                 } 
                // else if (type === 'workpiece') {
                //     //continue; // we draw the robots elsewhere
                // } 
                else if(type === 'workpiece0') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 0;
                    this.task.colorSelected[index] = 'salmon';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawMirroredBlock(30* pos.x, 30 * pos.y, angle, this.task.colorSelected[index],4, 60);

                    if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[index]+ this.task.timeInterval)
                    {

                        this.task.workpieceTimeSinceLastWorkpeiceUpdate[index] = this._timeElapsed;
                        this.task.history.workpiece0.push({
                            x: (pos.x).toFixed(2),
                            y: (pos.y).toFixed(2),
                            theta: angle.toFixed(1),
                            t: (this._timeElapsed/1000).toFixed(2)
                        });
                    }
                }
                else if (type === 'workpiece1') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 1;
                    this.task.colorSelected[index] = 'BlueViolet';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawMirroredBlock(30* pos.x, 30 * pos.y, angle, this.task.colorSelected[index], 4, 60);
                    if(this._timeElapsed - this.task.timeInterval> this.task.workpieceTimeSinceLastWorkpeiceUpdate[index])
                    {
                        this.task.workpieceTimeSinceLastWorkpeiceUpdate[index] = this._timeElapsed;
                        this.task.history.workpiece1.push({
                            x: (pos.x).toFixed(2),
                            y: (pos.y).toFixed(2),
                            theta: angle.toFixed(1),
                            t: (this._timeElapsed/1000).toFixed(2)
                        });
                    }
                    
                }

                 else {
                    //http://calebevans.me/projects/jcanvas/docs/polygons/
                    // draw the obstacles
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    color = this.constants.colorGoal;
                    if(type === 'obstacle') {
                        color = this.constants.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
                }
            }
        }

        
        meanx = 0;
        meany = 0;
        for( i = 0; i < this.task.numRobots; ++i) {
            //var radius = this.task.robots[i].m_fixtureList.m_shape.m_radius;
            pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
            //drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
        }
        varx = 0;
        vary = 0;
        covxy = 0;
        for( i = 0; i < this.task.numRobots; ++i) {
            pos = this.task.robots[i].GetPosition();
            varx =  varx + (pos.x-meanx)*(pos.x-meanx)/this.task.numRobots;
            vary =  vary + (pos.y-meany)*(pos.y-meany)/this.task.numRobots;
            covxy=  covxy+ (pos.x-meanx)*(pos.y-meany)/this.task.numRobots;
        }
                                
        if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[2]+ this.task.timeInterval)
        {
            
            this.task.workpieceTimeSinceLastWorkpeiceUpdate[2] = this._timeElapsed;
            this.task.history.swarm.push({
                meanx: meanx.toFixed(2),
                meany: meany.toFixed(2),
                varx: varx.toFixed(2),
                vary: vary.toFixed(2),
                covxy: covxy.toFixed(2),
                t: (this._timeElapsed/1000).toFixed(2)
            });
        }

        drawutils.drawRobot(30*this.task.objectposx[0], 30*this.task.objectposy[0],0, 30*0.1, this.constants.colorRobot,this.constants.colorRobotEdge );
        drawutils.drawRobot(30*this.task.objectposx[1], 30*this.task.objectposy[1],0, 30*0.1, this.constants.colorRobot,this.constants.colorRobotEdge );    
        // draw goal zone
        this.task.goals.forEach( function (g) { 
            pos = g.GetPosition();
            color = this.constants.colorGoal;
            
        }.bind(this));
    });

    game.setOverviewCallback( function() {
        var color = 'white';

        color = this.constants.colorGoal;

        drawutils.drawMirroredBlock(30 * 10,30 * 10, 0, 'BlueViolet',4, 120, 0.6);
        drawutils.drawMirroredBlock(30 * 10,30 * 10, 180, 'Salmon',4, 120, 0.6);
        drawutils.drawText(30*10,30*15,'Assemble This!', 1.5, this.constants.colorGoal, this.constants.colorGoal);

        if(this.mobileUserAgent) {
            drawutils.drawText(300,30*5,'move swarm by tilting screen', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }else{
            drawutils.drawText(300,30*5,'move swarm with arrow keys', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }
        
        var meanx = 0;
        var meany = 0;
        for(var i = 0; i < this.task.numRobots; ++i) {
            var pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
        }
        color = this.constants.colorRobot;
        drawutils.drawRect(30*meanx,30*(meany+1), 120,30, 'rgba(240, 240, 240, 0.7)');
        drawutils.drawText(30*meanx,30*(meany+1),this.task.numRobots+' Robots', 1.5, color, color);
        color = 'black';
        // drawutils.drawRect(30*meanx,30*(meany+2), 120,30, 'rgba(240, 240, 240, 0.7)');
        
        // if (this.task.btnCycle){
        //     var curMode = this.task.mode;

        //     $('.mode-button').removeClass('btn-success');

        //     curMode = this.task.mode = this.task.modes[Math.round(new Date().getTime()/2500)%this.task.modes.length];
            

        //     if( curMode === 'mean & variance') {
        //         curMode = 'mean±var';
        //     }

        //     $('#button-'+curMode).addClass('btn-success');
        // }

        // drawutils.drawText(30*meanx,30*(meany+2),this.task.mode, 1.5, color, color);
    });

    game.setUpdateCallback( function (dt, inputs) {
        URFP(dt);

        var maxImpTime = 2.0; //seconds to maximum impulse (without it, you can overshoot the goal position)

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
        var normalizer = Math.min(1 , this.task.impulse/Math.sqrt(this.impulseV.x*this.impulseV.x + this.impulseV.y*this.impulseV.y));
        var forceScaler = normalizer*(this.task.robotRadius*this.task.robotRadius)/0.25;

        //scale by robot size -- now scale by robot diameter (500 robots was SLOW).  These means we hose the first 26 results (bummer)
        this.impulseV.x *=  forceScaler;    
        this.impulseV.y *=  forceScaler;  
        // apply the user force to all the robots
        this.task.robots.forEach( function(r) { 
            var mag = this.task.noise*10*Math.random();
            var ang = 2*Math.PI*Math.random();
            var brownianImpulse = new phys.vec2( mag*Math.cos(ang) + this.impulseV.x,
                                                mag*Math.sin(ang) + this.impulseV.y);
            r.ApplyForce( brownianImpulse, r.GetWorldPoint( this.constants.zeroRef ) );
        }.bind(this) );
    });

    // game.setPregameCallback( function() {
    //     $('.mode-button').prop('disabled',true);
    // });

    game.setLoseTestCallback( function() {
        // in this game, we can't lose--no time constraints or anything.
        return false;
    });

    game.setLostCallback( function() {
        // nothing to do on lose.
    });


    game.setWinTestCallback( function() {

        var ret = true;
        
        var dist = Math.sqrt((this.task.objectposx[0]-this.task.objectposx[1])*(this.task.objectposx[0]-this.task.objectposx[1]) + (this.task.objectposy[0]-this.task.objectposy[1])*(this.task.objectposy[0]-this.task.objectposy[1]));
        if(dist>=0.1)
        {ret = true;}
        else 
        {ret = false;}
        return !ret;
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
            task: 'assembly',
            mode: this.task.noise,
            /* the "extra" key is used to store task-specific or run-specific information */
            extra: {
               history: this.task.history
            }
        };
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
}