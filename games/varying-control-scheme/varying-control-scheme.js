/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(Box2D);
    URFP(mathutils);

    var game = new GameFramework('varying-control-scheme', 'Varying Control Scheme', 'Control type');

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */
        var i;

        this.task = {};
        this.task.numRobots = 16;           // number of robots
        this.task.robots = [];              // array of bodies representing the robots
        this.task.blocks = [];              // array of bodies representing blocks
        this.task.goals = [];               // array of goals of form {x,y,w,h}

        // fixture definition for obstacles
        var fixDef = new phys.fixtureDef();
        fixDef.density = 20.0;
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
        

        // create short middle wall
        phys.makeBox(    this.world,
                    10, 10,
                    4, this.constants.obsThick);

        // create pyramid blocks        
        for(i = 0; i < 6; ++i) {
            this.task.blocks.push( phys.makeBlock(this.world, 4.5 + 2*i, 15, 0.5, 0.5, 'workpiece') );
        }

        // create some robots
        var xoffset = 8;
        var yoffset = 4;        
        for(i = 0; i < this.task.numRobots; ++i) {
            this.task.robots.push( phys.makeRobot(  this.world,
                                                    (i%4)*1.2 + xoffset,
                                                    1.2*Math.floor( i/4 ) + yoffset,
                                                    0.5,
                                                    'robot'));
        }

        // create goals
        var goalPositions = [ {x:10, y:8.2}, 
                              {x:9.5, y:9.2},
                              {x:10.5,y:9.2} ];

        fixDef.isSensor = true;
        fixDef.shape = new phys.polyShape();
        fixDef.shape.SetAsBox(0.2, 0.2);
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        goalPositions.forEach( function (gp) {
            bodyDef.position.Set(gp.x,gp.y);
            var body = this.world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);
            this.task.goals.push(body);
        }.bind(this));

    });

    game.setInitTaskCallback( function() {
        this.task.modes = ['attractive','repulsive','global'];
        this.task.mode = this.task.modes[ Math.ceil( Math.random() * this.task.modes.length ) - 1];        
        this.task.impulse =  50;            // impulse to move robots by
        this.impulseV = new phys.vec2(0,0); // global impulse to control all robots
        this.mX = 0;
        this.mY = 0;
        
        this.controllerActive = false;

        $('.mode-button').prop('disabled',false);
        $('#button-'+this.task.mode).addClass('btn-success');
        this.task.modes.forEach( function (mode) {
            $('#button-' + mode).click(function() {
                this.task.mode = mode;
                $('.mode-button').removeClass('btn-success');
                $('#button-'+mode).addClass('btn-success');
            }.bind(this));
        }.bind(this));        
    });

    game.setPregameCallback( function() {
        $('.mode-button').prop('disabled',true);
    });

    game.setDrawCallback( function() {
        drawutils.clearCanvas();
        var angle;
        

        //initialize robots to not be at goal
        this.task.blocks.forEach( function(b) {
            b.atGoal = false;
        }.bind(this));

        // draw goal zone
        this.task.goals.forEach( function (g) { 
            var f = g.GetFixtureList();
            var verts = f.GetShape().GetVertices();
            var X = verts[1].x - verts[0].x; 
            var Y = verts[2].y - verts[1].y;
            var pos = g.GetPosition();
            drawutils.drawEmptyRect(30*pos.x, 30*pos.y, 30* X*2.2, 30 * Y*2.2, this.constants.colorGoal,0,this.constants.strokeWidth);
            this.task.blocks.forEach( function (b) {
                var blockAABB = b.GetFixtureList().GetAABB();
                if ( blockAABB.Contains( g.GetFixtureList().GetAABB()) ) {
                    b.atGoal = true;
                }
            }.bind(this));  
        }.bind(this));
            
        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext()) {
            angle = b.GetAngle()*(180/Math.PI);
            var type = b.GetUserData();
            var pos = b.GetPosition();
            var X;
            var Y;
            var color;

            for(var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if ( type === 'goal') {
                    continue;
                }
                if ( type === 'robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                    if (this.task.mode === 'attractive' || this.task.mode === 'repulsive') {
                        drawutils.drawLine([[30*(-0.2+pos.x), 30*pos.y],[30*(0.2+pos.x), 30*pos.y]],'darkblue',true,this.constants.strokeWidthThick); // minus
                    }
                    if (this.task.mode === 'repulsive' ) {
                        drawutils.drawLine([[30*(pos.x), 30*(-0.2+pos.y)],[30*(pos.x), 30*(0.2+pos.y)]],'darkblue',true,this.constants.strokeWidthThick); //vertical
                    }
                } else if ( type === 'workpiece') {
                    // draw the object
                    X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    color = this.constants.colorObject;
                    if (b.atGoal === true) {
                        color = this.constants.colorObjectAtGoal;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30*X, 30 * Y, color,angle,this.constants.colorObjectEdge,this.constants.strokeWidth);
                } else {
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

        /* draw controller feedback */
        if( this.task.mode === 'global') {
            //draw arrow
            var ArrX = [-1,-1,0.2,0.2,1,0.2,0.2,-1,-1];
            var ArrY = [0,1/4,1/4,1/2,0,-1/2,-1/4,-1/4,0];
            // Add the points from the array to the object
            angle = Math.atan2(this.mY - 10, this.mX-10);
            var pts = [];
            for (var p=0; p<ArrX.length; p+=1) {
                pts.push([30*(10+Math.cos(angle)*ArrX[p]-Math.sin(angle)*ArrY[p]),30*(10+Math.sin(angle)*ArrX[p]+Math.cos(angle)*ArrY[p])]);
            } 
            drawutils.drawLine(pts,'rgba(0, 0, 153, 0.5)',true,18,false);
        } else {
            // draw controller position.  James asked for this, but the lag behind the cursor position is very noticeable, so I commented it out.
            drawutils.drawLine([ [30*(-0.2+this.mX), 30*this.mY],[30*(0.2+this.mX), 30*this.mY]],'darkblue',true); // minus
            drawutils.drawLine([    [   30*(this.mX), 30*(-0.2+this.mY)], [   30*(this.mX), 30*(0.2+this.mY)] ],'darkblue',true); //vertical
        }
    });

    game.setOverviewCallback( function() {
        var color = 'white';
        var meanx = 0;
        var miny =  Number.MAX_VALUE;
        var minx;
        var maxx =  Number.MIN_VALUE;
        var meany = 0;
        // draw goal zone
        this.task.goals.forEach( function (g) { 
            var pos = g.GetPosition();
            if( pos.x >maxx)
                {maxx = pos.x;}
            meanx = meanx + pos.x/this.task.goals.length;
            meany = meany + pos.y/this.task.goals.length;      
        }.bind(this));
        color = this.constants.colorGoal;
        drawutils.drawText(30*(maxx+2),30*meany,'←Goals', 1.5, color, color);


        meanx = 0;
        miny =  Number.MAX_VALUE;
        maxx =  Number.MIN_VALUE;
        meany = 0;
        this.task.blocks.forEach( function (g) { 
            var pos = g.GetPosition();
            if( pos.y < miny)
                {miny = pos.y;} 
            meanx = meanx + pos.x/this.task.blocks.length;
            meany = meany + pos.y/this.task.blocks.length;   
        }.bind(this));
        color = this.constants.colorObject;
        drawutils.drawText(30*(meanx),30*(miny-1),'Blocks', 1.5, color, color);

        if(this.mobileUserAgent) {
            drawutils.drawText(300,525,'Move Blocks to Goals with touchscreen', 1.5, color, color);
        } else {
            drawutils.drawText(300,525,'Move Blocks to Goals using your mouse', 1.5, color, color);
        }
        var strInstruction = '';
        var strControlMode = 'mouse click';
        if(this.mobileUserAgent) {
            strControlMode = 'your touch';
        }
        switch( this.task.mode ) {
            case 'attractive': strInstruction ='Robots are attracted to '+strControlMode; break;
            case 'repulsive' : strInstruction ='Robots are repulsed from '+strControlMode;break;
            case 'global' : strInstruction ='Robots move in direction of '+strControlMode;break;
        }
        drawutils.drawText(300,80,strInstruction, 1.5, color, color);
        drawutils.drawText(300,50,this.task.mode+' control:', 1.5, 'black', 'black');

        meanx = 0;
        miny =  Number.MAX_VALUE;
        minx =  Number.MAX_VALUE;
        meany = 0;
        for(var i = 0; i < this.task.robots.length; ++i) {
            var pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
            if( pos.y < miny)
                {miny = pos.y;}
            if( pos.x < minx)
                {minx = pos.x;}
        }
        color = this.constants.colorRobot;
        drawutils.drawText(30*(minx-2.3),30*(meany - 0.55),'Robots→', 1.5, color, color);
    });

    game.setUpdateCallback( function (dt, inputs) {
        URFP(dt);

        inputs.forEach( function( evt ) {
            switch (evt.type) {
                case 'mousedown':   this.controllerActive = true; break;
                case 'mouseup' :    this.controllerActive = false; break;
                case 'mousemove' :  this.mX = evt.x;
                                    this.mY = evt.y;
                                    break;
            }
        }.bind(this));

        // apply the user force to all the robots   
        if (this.controllerActive) {
            if (this.task.mode === 'global' ) {
                var angle = Math.atan2(this.mY - 10, this.mX-10);
                this.impulseV.x = 40* Math.cos(angle);
                this.impulseV.y = 40* Math.sin(angle);
                this.task.robots.forEach( function(r) {                                     
                    r.ApplyForce( this.impulseV, r.GetWorldPoint( this.constants.zeroRef ) );
                }.bind(this));
            } else {
                this.task.robots.forEach( function(r) { 
                    var rpos = r.GetPosition();             
                    var dx = this.mX - rpos.x;
                    var dy = this.mY - rpos.y;
                    var distSq = dx*dx + dy*dy;
                    var mag = Math.sqrt(distSq);
                    var h2 = 4;
                    var forceM = 100*distSq/Math.pow(distSq + h2,2);
                    if (this.task.mode === 'repulsive') {
                        this.impulseV.x = -20*dx/mag*forceM || 0;
                        this.impulseV.y = -20*dy/mag*forceM || 0;                    
                    } else {
                        this.impulseV.x = 20*dx/mag*forceM || 0;
                        this.impulseV.y = 20*dy/mag*forceM || 0;
                    }
                    r.ApplyForce( this.impulseV , r.GetWorldPoint( this.constants.zeroRef ) );    
                    
                }.bind(this) );    
            }        
        }
    });

    game.setWinTestCallback( function() {        
        // need to check if object has been moved into the goal zone
        var blockupied = 0;
        // for each goal, see if it contains a block
        this.task.blocks.forEach( function (b) {
            var blockAABB = b.GetFixtureList().GetAABB();
            this.task.goals.every( function (g) {
                var ret = blockAABB.Contains( g.GetFixtureList().GetAABB() );
                if (ret) {
                    blockupied++;
                }
                return !ret;
            }.bind(this));
        }.bind(this));    
        return blockupied === this.task.goals.length;
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
            task: 'varying-control-scheme',
            mode: this.task.mode
        };
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
}