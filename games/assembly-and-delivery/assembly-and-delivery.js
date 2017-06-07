/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    var game = new GameFramework('assembly-and-delivery', 'assembly-and-delivery','Visualization method');
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(mathutils);

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        this.task = {};
        this.task.numRobots = 100;          // number of robots
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

        this.task.blocks.push( phys.makeMirroredBlock(this.world, 17, 3, 'workpiece0'));
        this.task.blocks.push( phys.makeMirroredBlock(this.world, 17, 17, 'workpiece1'));
        

        // create the goal
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        bodyDef.position.Set(17,3.35);
        this.task.goals.push( this.world.CreateBody(bodyDef) );
        fixDef.isSensor = true;
        fixDef.shape = new phys.circleShape(2.5); 
        this.task.goals[0].CreateFixture(fixDef);


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
        this.task.modes = ['full-state', 'graph', 'mean & variance', 'mean'];
        this.task.mode = this.task.modes[ Math.ceil( Math.random() * this.task.modes.length ) - 1];
        
        this.impulseStart = null;
        this.task.impulse = 80;
        this.impulseV = new phys.vec2(0,0);
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        

        $('.mode-button').prop('disabled',false);
        
        //set the inital mode
        var curMode = this.task.mode;
        if( curMode === 'mean & variance') {
            curMode = 'mean±var';
        }
        $('#button-'+curMode).addClass('btn-success');
        //add click functionality
        this.task.modes.forEach( function (m) {
            var curMode = m;
            if( curMode === 'mean & variance') {
                curMode = 'mean±var';
            }
            $('#button-'+curMode).click(function() {
                $('.mode-button').removeClass('btn-success');
                $('#button-'+curMode).addClass('btn-success');
                this.task.mode = m;
            }.bind(this));
        }.bind(this));
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
        var meanNearx = [];
        var meanNeary = [];
        var angle;
        var X;
        var Y;
        var color;
        var verts;

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
            angle = b.GetAngle()*(180/Math.PI);
            var type = b.GetUserData();
            pos = b.GetPosition();
            var index;
            for (var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (type === 'goal') {
                    continue; // we drew the goal earlier
                }
                if (type ==='robot') {
                    continue; // we draw the robots elsewhere
                } 
                else if(type === 'workpiece0') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 0;
                    this.task.colorSelected[index] = 'salmon';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawMirroredBlock(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4, 60);
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
                    drawutils.drawMirroredBlock(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4,60);
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

        switch (this.task.mode) {
            case 'full-state': 
                                    meanx = 0;
                                    meany = 0;
                                    for( i = 0; i < this.task.numRobots; ++i) {
                                    var radius = this.task.robots[i].m_fixtureList.m_shape.m_radius;
                                    pos = this.task.robots[i].GetPosition();
                                    meanx = meanx + pos.x/this.task.numRobots;
                                    meany = meany + pos.y/this.task.numRobots;
                                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                                }
                                varx = 0;
                                vary = 0;
                                for( i = 0; i < this.task.numRobots; ++i) {
                                        pos = this.task.robots[i].GetPosition();
                                        varx =  varx + (pos.x-meanx)*(pos.x-meanx)/this.task.numRobots;
                                        vary =  vary + (pos.y-meany)*(pos.y-meany)/this.task.numRobots;
                                        covxy=  covxy+ (pos.x-meanx)*(pos.y-meany)/this.task.numRobots;
                                    }
                                break;
            
            case 'mean & variance': // http://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
                                    // t95% confidence ellipse
                                    meanx = 0;
                                    meany = 0;
                                    varx = 0;
                                    vary = 0;
                                    covxy = 0;
                                    for( i = 0; i < this.task.numRobots; ++i) {
                                        pos = this.task.robots[i].GetPosition();
                                        meanx = meanx + pos.x/this.task.numRobots;
                                        meany = meany + pos.y/this.task.numRobots;
                                    }
                                    for( i = 0; i < this.task.numRobots; ++i) {
                                        pos = this.task.robots[i].GetPosition();
                                        varx =  varx + (pos.x-meanx)*(pos.x-meanx)/this.task.numRobots;
                                        vary =  vary + (pos.y-meany)*(pos.y-meany)/this.task.numRobots;
                                        covxy=  covxy+ (pos.x-meanx)*(pos.y-meany)/this.task.numRobots;
                                    }
                                    var diffeq = Math.sqrt( (varx-vary)*(varx-vary)/4 + covxy*covxy);
                                    var varxp = (varx+vary)/2 + diffeq;
                                    var varyp = (varx+vary)/2 - diffeq;
                                    angle = 180/Math.PI*1/2*Math.atan2( 2*covxy, varx-vary);

                                    drawutils.drawRobot( 30*meanx, 30*meany,0, 15, 'red',this.constants.colorRobot);
                                    drawutils.drawEllipse( 30*meanx, 30*meany,2.4*30*Math.sqrt(varxp), 2.4*30*Math.sqrt(varyp),angle,'red',4 );

                                    break;
            case 'mean':    meanx = 0;
                            meany = 0;
                            varx = 0;
                            vary = 0;
                            for( i = 0; i < this.task.numRobots; ++i) {
                                pos = this.task.robots[i].GetPosition();
                                meanx = meanx + pos.x/this.task.numRobots;
                                meany = meany + pos.y/this.task.numRobots;
                            }
                            drawutils.drawRobot( 30*meanx, 30*meany,0, 15, 'red',this.task.colorRobot);
                            for( i = 0; i < this.task.numRobots; ++i) {
                                        pos = this.task.robots[i].GetPosition();
                                        varx =  varx + (pos.x-meanx)*(pos.x-meanx)/this.task.numRobots;
                                        vary =  vary + (pos.y-meany)*(pos.y-meany)/this.task.numRobots;
                                        covxy=  covxy+ (pos.x-meanx)*(pos.y-meany)/this.task.numRobots;
                                    }
                            break;
            case 'graph':   var R = 5;
                            meanx = 0;
                            meany = 0;
                            meanNearx = [];
                            meanNeary = [];
                            varx = 0;
                            vary = 0;
                            covxy = 0;
                            var varNearx = [];
                            var varNeary = [];
                            var covNearxy = [];
                            var nearRobots = [];
                            var j;
                            for (i = 0 ; i < this.task.numBlocks; ++i)
                            {
                                nearRobots[i] = 0;
                                meanNearx[i] = 0;
                                meanNeary[i] = 0;
                                varNearx[i] = 0;
                                varNeary[i] = 0;
                                covNearxy[i] = 0;
                            }

                            for( i = 0; i < this.task.numRobots; ++i) {

                                pos = this.task.robots[i].GetPosition();
                                meanx = meanx + pos.x;
                                meany = meany + pos.y;

                                for ( j = 0 ; j< this.task.numBlocks; j ++){
                                if (Math.sqrt((pos.x-this.task.objectposx[j])*(pos.x-this.task.objectposx[j]) + (pos.y-this.task.objectposy[j])*(pos.y-this.task.objectposy[j])) <= R){

                                    meanNearx[j] = meanNearx[j] + pos.x;
                                    meanNeary[j] = meanNeary[j] + pos.y;
                                    
                                    ++nearRobots[j];
                                
                                }
                            }
                            }
                            meanx = meanx/this.task.numRobots;
                            meany = meany/this.task.numRobots;
                            for (i = 0; i < this.task.numBlocks; i++){
                            meanNearx[i]= meanNearx[i]/nearRobots[i];
                            meanNeary[i] = meanNeary[i]/nearRobots[i];
                        }

                            for( i = 0; i < this.task.numRobots; ++i) {
                                pos = this.task.robots[i].GetPosition();
                                varx =  varx + (pos.x-meanx)*(pos.x-meanx)/this.task.numRobots;
                                vary =  vary + (pos.y-meany)*(pos.y-meany)/this.task.numRobots;
                                covxy=  covxy+ (pos.x-meanx)*(pos.y-meany)/this.task.numRobots;
                                for (j = 0 ; j < this.task.numBlocks; j ++){
                                if (Math.sqrt((pos.x-this.task.objectposx[j])*(pos.x-this.task.objectposx[j]) + (pos.y-this.task.objectposy[j])*(pos.y-this.task.objectposy[j])) <= R)
                                {
                                    varNearx[j] =  varNearx[j] + (pos.x-meanNearx[j])*(pos.x-meanNearx[j])/nearRobots[j];
                                    varNeary[j] =  varNeary[j] + (pos.y-meanNeary[j])*(pos.y-meanNeary[j])/nearRobots[j];
                                    covNearxy[j]=  covNearxy[j]+ (pos.x-meanNearx[j])*(pos.y-meanNeary[j])/nearRobots[j];
                                }
                            }
                            }
                            for (j = 0; j < this.task.numBlocks; j++){
                            diffeq = Math.sqrt( (varNearx[j] - varNeary[j])*(varNearx[j] -varNeary[j])/4 + covNearxy[j]*covNearxy[j]);
                            varxp = (varNearx[j]+varNeary[j])/2 + diffeq;
                            varyp = (varNearx[j]+varNeary[j])/2 - diffeq;
                            angle = 180/Math.PI*1/2*Math.atan2( 2*covNearxy[j], varNearx[j]-varNeary[j]);

                            
                            
                            drawutils.drawRobot( 30*meanNearx[j], 30*meanNeary[j] ,0, 10, this.task.colorSelected[j],this.task.colorRobot); // draw mean
                            drawutils.drawEllipse( 30*meanNearx[j], 30*meanNeary[j],2.4*30*Math.sqrt(varxp), 2.4*30*Math.sqrt(varyp),angle,this.task.colorSelected[j],4 ); // draw ellipse
                        }
                        diffeq = Math.sqrt( (varx-vary)*(varx-vary)/4 + covxy*covxy);
                                 varxp = (varx+vary)/2 + diffeq;
                                 varyp = (varx+vary)/2 - diffeq;
                                    angle = 180/Math.PI*1/2*Math.atan2( 2*covxy, varx-vary);
                                    drawutils.drawRobot( 30*meanx, 30*meany,0, 15, 'red',this.constants.colorRobot);
                                    drawutils.drawEllipse( 30*meanx, 30*meany,2.4*30*Math.sqrt(varxp), 2.4*30*Math.sqrt(varyp),angle,'red',4 );
                            break;
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
            drawutils.drawText(30*pos.x,30*pos.y,'Goal', 1.5, color, color);
        }.bind(this));
    });

    game.setOverviewCallback( function() {
        var color = 'white';

        drawutils.drawMirroredBlock(30 * 5, 30 * 10, 0, 'BlueViolet',4, 120);
        drawutils.drawMirroredBlock(30 * 5, 30 * 10, 180, 'Salmon',4, 120);
        drawutils.drawText(30 * 5, 30 * 5,'Assemble This!', 1.5, this.constants.colorGoal, this.constants.colorGoal);

        if(this.mobileUserAgent) {
            drawutils.drawText(300, 30*14,'move swarm to goal by tilting screen', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }else{
            drawutils.drawText(300, 30*14,'move swarm to goal with arrow keys', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }

        var pGoalArrow = [[425,150],[30 * 9,30 * 8]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoalArrow,false,25,true);

        pGoalArrow = [[425 + Math.sin(180) * 40, 150 + Math.cos(180) * 40],[425,150],[425 + Math.sin(270) * 40, 150 + Math.cos(270) * 40]];
        drawutils.drawLine(pGoalArrow,this.constants.colorGoalArrow,false,25,true);
         drawutils.drawText(347, 195,'push object to goal', 1, color, color, -30);
        
        

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
        drawutils.drawRect(30*meanx,30*(meany+2), 120,30, 'rgba(240, 240, 240, 0.7)');
        this.task.mode = this.task.modes[Math.round(new Date().getTime()/2500)%this.task.modes.length];
        drawutils.drawText(30*meanx,30*(meany+2),this.task.mode, 1.5, color, color);
        
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
            var mag = 5*Math.random();
            var ang = 2*Math.PI*Math.random();
            var brownianImpulse = new phys.vec2( mag*Math.cos(ang) + this.impulseV.x,
                                                mag*Math.sin(ang) + this.impulseV.y);
            r.ApplyForce( brownianImpulse, r.GetWorldPoint( this.constants.zeroRef ) );
        }.bind(this) );
    });

    game.setPregameCallback( function() {
        $('.mode-button').prop('disabled',true);
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
        var goalPos;
        // need to check if object has been moved into the goal zone
            // we use _.every because it will stop iterating on success
            this.task.goals.every( function (g) {
                goalPos = g.GetPosition();
                var dist = Math.sqrt((this.task.objectposx[0]-this.task.objectposx[1])*(this.task.objectposx[0]-this.task.objectposx[1]) + (this.task.objectposy[0]-this.task.objectposy[1])*(this.task.objectposy[0]-this.task.objectposy[1]));
                var goalDist = Math.sqrt((this.task.objectposx[0]-goalPos.x)*(this.task.objectposx[0]-goalPos.x) + (this.task.objectposy[0]-goalPos.y)*(this.task.objectposy[0]-goalPos.y));
                if(dist>= 0.1 || goalDist>=0.7)
                {
                    ret = true;
                }
                else 
                {
                    ret = false;
                }

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
            task: 'assembly-and-delivery',
            mode: this.task.mode,
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