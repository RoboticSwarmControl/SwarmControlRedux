/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    var game = new GameFramework('peg-in-hole', 'peg-in-hole','Number of robots');
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(mathutils);
    var myParticipant =  document.cookie.slice(document.cookie.indexOf('task_sig')+('task_sig').length+1); //substring starting at task_sig 
    if (myParticipant.indexOf(';') !== -1) {
        myParticipant = myParticipant.substr(0,myParticipant.indexOf(';')); //trim any extra info off the string
    }
    var setupRobots = function(numRobots) {
        //this.task.robotRadius = 0.5*4.0/Math.sqrt(this.task.numRobots);
        this.task.robotRadius = 0.5*4.0/Math.sqrt(100);
        
        // remove existing robots
        this.task.robots.forEach( function(bot){
            phys.destroyRobot(this.world, bot);
        }.bind(this));
        this.task.robots.length = 0;

        // add robots
        var rowLength = Math.floor(7/(2*this.task.robotRadius));
        var xoffset = this.task.robotRadius+0.5;
        var yoffset = 14+this.task.robotRadius;

        for(var i = 0; i < numRobots; ++i) {
            this.task.robots.push( phys.makeRobot(  this.world,
                                                    (i%rowLength)*2.1*this.task.robotRadius + xoffset,
                                                    Math.floor(i/rowLength)*2.1*this.task.robotRadius + yoffset,
                                                    this.task.robotRadius,
                                                    'robot'));
        }
    }.bind(game);

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};
        
        if(this.mobileUserAgent) {
            this.task.minRobots = 1;
            this.task.maxRobots = 70;
        }         
        else{
            this.task.minRobots = 1;
            this.task.maxRobots = 250;
        }
        this.task.numRobots = Math.floor((Math.random()*this.task.maxRobots)+1);          // number of robots
        
        
        this.task.numBlocks = 1;
        //this.task.robotRadius = 0.5*4.0/Math.sqrt(this.task.numRobots);
        this.task.robotRadius = 0.5*4.0/Math.sqrt(100);
        this.task.robots = [];              // array of bodies representing the robots
        this.task.goals = [];               // array of goals of form {x,y,w,h}
        this.task.blocks = [];              // array of bodies representing blocks
        var i;
        this.task.objectposx = [];
        this.task.objectposy = [];
        this.task.colorSelected = [];
        this.task.history = {
            workpiece: [],
            swarm: []
        };
        this.task.workpieceTimeSinceLastWorkpeiceUpdate = [0,0];
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

        // create mid lower wall    
        phys.makeBox(    this.world,
                    25, 6.66,
                    20, this.constants.obsThick);

        // create mid upper wall
        phys.makeBox(    this.world,
                    -5, 13.33,
                    20, this.constants.obsThick);

        // // create goal top wall
        // phys.makeBox( this.world, 20- this.constants.obsThick-Math.sqrt(3)/4,0, Math.sqrt(3)/4, 1.85
        //             );
        //         // create goal bottom wall
        // phys.makeBox( this.world, 20-this.constants.obsThick-Math.sqrt(3)/4,this.constants.obsThick+5.1, Math.sqrt(3)/4, 1.15
        //             );


        // create block
        this.task.blocks.push( phys.makeBulgyBlock(this.world, 10, 16.5, 'workpiece'));



        //create goal
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = 'goal';
            bodyDef.position.Set(18,3.5);        

            this.task.goals.push( this.world.CreateBody(bodyDef) );
            fixDef.isSensor = true;

            var Mpoints1 = [ 
                            {x: Math.sqrt(3)/4, y: -1/2},
                            {x: Math.sqrt(3)/2, y: -1/2},
                            {x: Math.sqrt(3)/2, y: 1/2},
                            {x: Math.sqrt(3)/4 , y: 1/2}
                            ];
            var Mpoints2 = [ 
                            {x: 0, y: 1},
                            {x: 0, y: 1/2},
                            {x: Math.sqrt(3)/2, y:  1/2}
                            ];
            var Mpoints3 = [ 
                            {x: 0, y: -1},
                            {x: Math.sqrt(3)/2, y: -1/2},
                            {x: 0, y: -1/2}
                            
                            ];

            var Mpoints = [Mpoints1, Mpoints2,Mpoints3];
            var points = [];
            for (var j = 0 ; j< Mpoints.length; j++){
                points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(2*Mpoints[j][i].x, 2*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                this.task.goals[0].CreateFixture(fixDef);
            }

                // create the static object for the goal

                bodyDef.type = phys.body.b2_staticBody;
            bodyDef.userData = 'goalStatue';
            bodyDef.position.Set(18,3.5);        
            //this.task.blocks.push( this.world.CreateBody(bodyDef) );
            
            fixDef.isSensor = false;
            for (j = 0 ; j< Mpoints.length; j++){
                points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(2*Mpoints[j][i].x, 2*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);

                this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }


        
       
        // create some robots
        var xoffset = this.task.robotRadius+0.5;
        var yoffset = 14+this.task.robotRadius;        
        for(i = 0; i < this.task.numRobots; ++i) {
            this.task.robots.push( phys.makeRobot(  this.world,
                                                    xoffset + 7*Math.random(),
                                                    yoffset +5*Math.random(),
                                                    this.task.robotRadius,
                                                    'robot'));
        }
    });

    game.setInitTaskCallback( function() {
          this.task.impulse = 80;             // impulse to move robots by
        this.impulseV = new phys.vec2(0,0); // global impulse to control all robots

        var $robotCounter = $('#select-robot-count');
        $robotCounter.html(this.task.numRobots);
  
        this.task.clickStart = null;
        this.task.clickTimeout = null;

        this.$addRobotButton = $('#-add-robots');
        this.$addRobotButton.on('mousedown', function(evt){
            URFP(evt);
            
            this.task.clickStart = new Date();
            this.task.clickTimeout = window.setTimeout( function _handleAddClick(){
                if (this.task.numRobots < this.task.maxRobots) {
                    this.task.numRobots++;
                    $robotCounter.html(this.task.numRobots);
                    this.task.clickTimeout = window.setTimeout( _handleAddClick.bind(this), 250 );
                }
            }.bind(this),0);

            $(window).on('mouseup', function(evt){
                URFP(evt);
                if (this.task.clickTimeout) {
                    setupRobots(this.task.numRobots);
                    window.clearTimeout( this.task.clickTimeout );
                    this.task.clickTimeout = null;
                }
            }.bind(this));
        }.bind(this));
        

        this.$removeRobotButton = $('#-remove-robots');
        this.$removeRobotButton.on('mousedown', function(evt){
            URFP(evt);            
            
            this.task.clickStart = new Date();
            this.task.clickTimeout = window.setTimeout( function _handleRemoveClick(){
                if (this.task.numRobots > this.task.minRobots) {
                    this.task.numRobots--;                    
                    $robotCounter.html(this.task.numRobots);
                    this.task.clickTimeout = window.setTimeout( _handleRemoveClick.bind(this), 250 );
                }                
            }.bind(this),0);

            $(window).on('mouseup', function(evt){
                URFP(evt);
                if (this.task.clickTimeout) {
                    setupRobots(this.task.numRobots);
                    window.clearTimeout( this.task.clickTimeout );
                    this.task.clickTimeout = null;
                }
            }.bind(this));
        }.bind(this));
        $('#unique-id-player').html(myParticipant);
    });

    game.setPregameCallback( function() {
        this.$addRobotButton.prop('disabled',true);
        this.$removeRobotButton.prop('disabled',true);
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

        // draw goal zone
        this.task.goals.forEach( function (g) { 
             var f = g.GetFixtureList();
             verts = f.GetShape().GetVertices();
            // //var radius = f.GetShape().GetRadius();
            pos = g.GetPosition();
            angle = g.GetAngle()* 180 / Math.PI- Math.PI/2*180 /Math.PI;
            X = verts[1].x - verts[0].x; 
            Y = verts[2].y - verts[1].y;
            drawutils.drawDishedBlock(30*pos.x, 30*pos.y,270,color,4, 60);
            drawutils.drawRobot(30*pos.x, 30*pos.y,0, 30*0.1, this.constants.colorRobot,this.constants.colorRobotEdge );
        }.bind(this));



        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext())
        {
            angle = b.GetAngle()*(180/Math.PI);
            var type = b.GetUserData();
            pos = b.GetPosition();

            for (var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (type === 'goal') {
                    continue; // we drew the goal earlier
                }
                if (type ==='robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                } else if (type === 'workpiece') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    color = this.constants.colorObject;
                    
                    this.task.objectposx[0] = pos.x;
                    this.task.objectposy[0] = pos.y;
                    this.task.colorSelected[0] = 'green';
                    drawutils.drawBulgyBlock(30* pos.x,30 * pos.y, angle, color,4);
                    drawutils.drawRobot(30*pos.x, 30*pos.y,0, 30*0.1, this.constants.colorRobot,this.constants.colorRobotEdge );
                    if(this.task.workpieceTimeSinceLastWorkpeiceUpdate[0]===0 ||this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[0]+ this.task.timeInterval)
                    {

                        this.task.workpieceTimeSinceLastWorkpeiceUpdate[0] = this._timeElapsed;
                        this.task.history.workpiece.push({
                            x: (pos.x).toFixed(2),
                            y: (pos.y).toFixed(2),
                            theta: angle.toFixed(2),
                            t: (this._timeElapsed/1000).toFixed(2)
                        });
                    }
                } else if (type === 'goalStatue'){
                    continue; // we draw goal earlier
                 }  else {
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
           // drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
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
      
            
        if(this.task.workpieceTimeSinceLastWorkpeiceUpdate[1]===0 || this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[1]+ this.task.timeInterval)
        {
            
            this.task.workpieceTimeSinceLastWorkpeiceUpdate[1] = this._timeElapsed;
            this.task.history.swarm.push({
                meanx: meanx.toFixed(2),
                meany: meany.toFixed(2),
                varx: varx.toFixed(2),
                vary: vary.toFixed(2),
                covxy: covxy.toFixed(2),
                t: (this._timeElapsed/1000).toFixed(2)
            });
        }

        // draw goal zone
        this.task.goals.forEach( function (g) { 
            pos = g.GetPosition();
            color = this.constants.colorGoal;
            drawutils.drawText(30*pos.x,30*(pos.y+2.5),'Goal', 1.5, color, color);
        }.bind(this));
    });

    game.setOverviewCallback( function() {
        var color = 'white';

        //draw arrow from object to goal
        var pGoalArrow = [[400,495],[525,495],[525,300],[80,300],[80,100],[400,100]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoalArrow,false,50,true);
        var aY = 20;
        var aX = 50;
        pGoalArrow = [[400-aX,100+aY],[400,100],[400-aX,100-aY]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoalArrow,false,50,false);
        // (←,↑,↓,→)
        if(this.mobileUserAgent) {
            drawutils.drawText(300,300,'move object to goal by tilting screen', 1.5, 'white', 'white');
        }else{
            drawutils.drawText(300,300,'move object to goal with arrow keys', 1.5, 'white', 'white');
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
        color = 'green';
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
            var mag = 5 *Math.random();
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

    var goalPos;
    var pos;
    this.task.blocks.forEach(function(b){
    this.task.goals.every( function (g) {
    goalPos = g.GetPosition();
    pos = b.GetPosition();
    var dist = Math.sqrt((pos.x-goalPos.x)*(pos.x-goalPos.x) + (pos.y-goalPos.y)*(pos.y-goalPos.y));
    if(dist>=0.1)
    {ret = true;}
    else 
    {ret = false;}
    return !ret;
}.bind(this));
}.bind(this));
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
            task: 'peg-in-hole',
            mode: 'default',
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