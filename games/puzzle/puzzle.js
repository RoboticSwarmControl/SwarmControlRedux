/* jshint unused:false */
/* ^ done because we export */

function theGame($,phys,GameFramework, Box2D, drawutils, mathutils) {
    /* jshint unused:true */
    'use strict';

    var game = new GameFramework('puzzle', 'puzzle','Size of shape');
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(mathutils);
    
    

    game.setSpawnWorldCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */
        this.task = {};
        
        if(this.mobileUserAgent) {
            this.task.numRobots = 20;
        }          // number of robots
        else{
            this.task.numRobots = 100;
        }
        
        this.task.shapeSize = Math.floor(9*Math.random())/2+1;

        this.task.numBlocks = 4;
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
            workpiece2: [],
            workpiece3: [],
            swarm: []
        };
        this.task.workpieceTimeSinceLastWorkpeiceUpdate = [0,0,0,0];
        this.task.timeInterval = 2000;
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



        this.task.blocks.push( phys.makePuzzle1(this.world, 3, 15, 180,'workpiece0', this.task.shapeSize));
        this.task.blocks.push( phys.makePuzzle2(this.world, 3, 3, 180,'workpiece1', this.task.shapeSize));
        this.task.blocks.push( phys.makePuzzle3(this.world, 15, 3 ,180, 'workpiece2', this.task.shapeSize));
        this.task.blocks.push( phys.makePuzzle4(this.world, 15, 15,180,'workpiece3', this.task.shapeSize));

        // create the goal
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        // bodyDef.position.Set(18- this.constants.obsThick-2* Math.sqrt(3)/2,3);
        bodyDef.position.Set(17,5);
        this.task.goals.push( this.world.CreateBody(bodyDef) );
        fixDef.isSensor = true;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        //fixDef.shape.SetAsBox(Math.sqrt(3)/4, 0.8); 
        var Mpoints = [    
                                {x: 0, y:1},
                                {x: -Math.sqrt(3)/2, y:1/2}, 
                                {x: -Math.sqrt(3)/2, y: -1/2}, 
                                {x: 0, y:-1},
                                {x: Math.sqrt(3)/2, y: -1/2}, 
                                {x: Math.sqrt(3)/2, y: 1/2}, 
                                 ];
            var points = [];
            for ( i = 0; i < Mpoints.length; i++) {
                points.push( new phys.vec2(1*Mpoints[i].x, 1 *Mpoints[i].y) );
            }
        
        fixDef.shape.SetAsArray(points, points.length);
        this.task.goals[0].CreateFixture(fixDef);

// <<<<<<< RandomizedGames
//         // create some robots        
//         setupRobots(this.task.numRobots);

//         var generateAngle1 = Math.PI * Math.random();
//         var generateAngle2 = Math.PI * Math.random();
//         var generateAngle3 = Math.PI * Math.random();
//         var generateAngle4 = Math.PI * Math.random();

//         var startPos = [
//             {x: 5, y: 5},
//             {x: 5, y: 15},
//             {x: 15, y: 15},
//             {x: 15, y: 5},
//         ];

//         for ( i = 0; i < 4; i++) {
//             var k = Math.floor(startPos.length * Math.random());
//             switch(i){
//                 case 0 : this.task.blocks.push( phys.makePuzzle1(this.world, startPos[k].x + 2 * Math.cos(generateAngle1 - Math.PI*1/4), startPos[k].y + 2 * Math.sin(generateAngle1 - Math.PI*1/4), 'workpiece0', generateAngle1)); break;
//                 case 1 : this.task.blocks.push( phys.makePuzzle2(this.world, startPos[k].x + 2 * Math.cos(generateAngle2 + Math.PI*1/6), startPos[k].y + 2 * Math.sin(generateAngle2 + Math.PI*1/6), 'workpiece1', generateAngle2)); break;
//                 case 2 : this.task.blocks.push( phys.makePuzzle3(this.world, startPos[k].x + 2 * Math.cos(generateAngle3 + Math.PI*2/3), startPos[k].y + 2 * Math.sin(generateAngle3 + Math.PI*2/3), 'workpiece2', generateAngle3)); break;
//                 case 3 : this.task.blocks.push( phys.makePuzzle4(this.world, startPos[k].x + 2 * Math.cos(generateAngle4 - Math.PI*3/4), startPos[k].y + 2 * Math.sin(generateAngle4 - Math.PI*3/4), 'workpiece3', generateAngle4)); break;
//             }
//             startPos.splice(k, 1);
// =======
        // create some robots
        var offset = 0.5 + this.task.robotRadius;  
        var xassign = 0;
        var yassign = 0;        
        for(i = 0; i < this.task.numRobots; ++i) {
            do{
                xassign = offset + (20 - 2*offset) * Math.random();
                yassign = offset + (20 - 2*offset) * Math.random();
            } 
            while(
                mathutils.lineDistance(3 - this.task.shapeSize * 2/3 * Math.cos(Math.PI - Math.PI*1/3), 15 - this.task.shapeSize * 2/3 * Math.sin(Math.PI - Math.PI*1/3), xassign, yassign) < this.task.shapeSize * 1/2 + this.task.robotRadius ||
                mathutils.lineDistance(3 - this.task.shapeSize/2 * Math.cos(Math.PI + Math.PI*1/6), 3 - this.task.shapeSize/2 * Math.sin(Math.PI + Math.PI*1/6), xassign, yassign) < this.task.shapeSize * 7/8 + this.task.robotRadius ||
                mathutils.lineDistance(15 - this.task.shapeSize/2 * Math.cos(Math.PI + Math.PI*2/3), 3 - this.task.shapeSize/2 * Math.sin(Math.PI + Math.PI*2/3), xassign, yassign) < this.task.shapeSize + this.task.robotRadius ||
                mathutils.lineDistance(15 - this.task.shapeSize * 1/2 * Math.cos(Math.PI - Math.PI*3/4), 15 - this.task.shapeSize * 1/2 * Math.sin(Math.PI - Math.PI*3/4), xassign, yassign) < this.task.shapeSize * 7/8 + this.task.robotRadius
            );


            this.task.robots.push( phys.makeRobot(  this.world,
                                                    xassign,
                                                    yassign,
                                                    this.task.robotRadius,
                                                    'robot'));

        }
    });
    game.setInitTaskCallback( function() {  
        this.mX = 0;
        this.mY = 0;
        this.impulseV = new phys.vec2(0,0);
        this.task.impulse = 50;
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;

        $('#task-mode-power').html(this.task.shapeSize);
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

                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                } else if (type === 'workpiece0') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 0;
                    this.task.colorSelected[index] = 'green';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawPuzzle1(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4,this.task.shapeSize*30,1);
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
                else if(type === 'workpiece1') {
                    // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 1;
                    this.task.colorSelected[index] = 'salmon';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawPuzzle2(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4, this.task.shapeSize*30,1);
                    if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[index]+ this.task.timeInterval)
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
                else if(type === 'workpiece2'){
                                        // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 2;
                    this.task.colorSelected[index] = 'seagreen';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawPuzzle3(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4,this.task.shapeSize*30,1);
                    if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[index]+ this.task.timeInterval)
                    {

                        this.task.workpieceTimeSinceLastWorkpeiceUpdate[index] = this._timeElapsed;
                        this.task.history.workpiece2.push({
                            x: (pos.x).toFixed(2),
                            y: (pos.y).toFixed(2),
                            theta: angle.toFixed(1),
                            t: (this._timeElapsed/1000).toFixed(2)
                        });
                    }
                }
                else if(type === 'workpiece3'){
                                                            // draw the pushable object
                    verts = f.GetShape().GetVertices();
                    X = verts[1].x - verts[0].x; 
                    Y = verts[2].y - verts[1].y;
                    index = 3;
                    this.task.colorSelected[index] = 'coral';
                    this.task.objectposx[index] = pos.x;
                    this.task.objectposy[index] = pos.y;
                    drawutils.drawPuzzle4(30* pos.x,30 * pos.y, angle, this.task.colorSelected[index],4,this.task.shapeSize*30,1);
                    if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[index]+ this.task.timeInterval)
                    {

                        this.task.workpieceTimeSinceLastWorkpeiceUpdate[index] = this._timeElapsed;
                        this.task.history.workpiece3.push({
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

            pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
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
                               
        if(this._timeElapsed > this.task.workpieceTimeSinceLastWorkpeiceUpdate[4]+ this.task.timeInterval)
        {
            
            this.task.workpieceTimeSinceLastWorkpeiceUpdate[4] = this._timeElapsed;
            this.task.history.swarm.push({
                meanx: meanx.toFixed(2),
                meany: meany.toFixed(2),
                varx: varx.toFixed(2),
                vary: vary.toFixed(2),
                covxy: covxy.toFixed(2),
                t: (this._timeElapsed/1000).toFixed(2)
            });
        }
    });

    game.setOverviewCallback( function() {
        var color = 'white';

        drawutils.drawPuzzle1(30* 10, 30 * 10, 0, this.task.colorSelected[0],4,this.task.shapeSize*30,0.6);
        drawutils.drawPuzzle2(30* 10, 30 * 10, 0, this.task.colorSelected[1],4,this.task.shapeSize*30,0.6);
        drawutils.drawPuzzle3(30* 10, 30 * 10, 0, this.task.colorSelected[2],4,this.task.shapeSize*30,0.6);
        drawutils.drawPuzzle4(30* 10, 30 * 10, 0, this.task.colorSelected[3],4,this.task.shapeSize*30,0.6);
        drawutils.drawText(30 * 10, 30 * 15,'Assemble This!', 1.5, this.constants.colorGoal, this.constants.colorGoal);

        if(this.mobileUserAgent) {
            drawutils.drawText(300,30*2,'move swarm by tilting screen', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }else{
            drawutils.drawText(300,30*2,'move swarm with arrow keys', 1.5, this.constants.colorGoal, this.constants.colorGoal);
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



    game.setLoseTestCallback( function() {
        // in this game, we can't lose--no time constraints or anything.
        return false;
    });

    game.setLostCallback( function() {
        // nothing to do on lose.
    });

    game.setWinTestCallback( function() {
        this.task.goals.forEach( function (g) { 
            var pos = g.GetPosition();
                        // draw the goal of the game
            drawutils.drawPuzzle1(30* pos.x,30 * (pos.y-2), 0, this.task.colorSelected[0],4,45,0.6);
            drawutils.drawPuzzle2(30* pos.x,30 * (pos.y-2), 0, this.task.colorSelected[1],4,45,0.6);
            drawutils.drawPuzzle3(30* pos.x,30 * (pos.y-2), 0, this.task.colorSelected[2],4,45,0.6);
            drawutils.drawPuzzle4(30* pos.x,30 * (pos.y-2), 0, this.task.colorSelected[3],4,45,0.6);
            drawutils.drawText(30*pos.x,30*pos.y,'Goal', 1.5, this.constants.colorGoal, this.constants.colorGoal);
        }.bind(this));
        
        var ret = true;
        drawutils.drawRobot(30*this.task.objectposx[0], 30*this.task.objectposy[0],0, 30*0.2, this.task.colorSelected[0],this.constants.colorRobotEdge );
        drawutils.drawRobot(30*this.task.objectposx[1], 30*this.task.objectposy[1],0, 30*0.2, this.task.colorSelected[1],this.constants.colorRobotEdge );
        drawutils.drawRobot(30*this.task.objectposx[2], 30*this.task.objectposy[2],0, 30*0.2, this.task.colorSelected[2],this.constants.colorRobotEdge );
        drawutils.drawRobot(30*this.task.objectposx[3], 30*this.task.objectposy[3],0, 30*0.2, this.task.colorSelected[3],this.constants.colorRobotEdge );
        var dist1 = Math.sqrt((this.task.objectposx[0]-this.task.objectposx[1])*(this.task.objectposx[0]-this.task.objectposx[1]) + (this.task.objectposy[0]-this.task.objectposy[1])*(this.task.objectposy[0]-this.task.objectposy[1]));
        var dist2 = Math.sqrt((this.task.objectposx[2]-this.task.objectposx[1])*(this.task.objectposx[2]-this.task.objectposx[1]) + (this.task.objectposy[2]-this.task.objectposy[1])*(this.task.objectposy[2]-this.task.objectposy[1]));
        var dist3 = Math.sqrt((this.task.objectposx[0]-this.task.objectposx[3])*(this.task.objectposx[0]-this.task.objectposx[3]) + (this.task.objectposy[0]-this.task.objectposy[3])*(this.task.objectposy[0]-this.task.objectposy[3]));
        if(dist1 >= 0.1 || dist2 >= 0.1 || dist3 >= 0.1)
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
            task: 'puzzle',

            mode: this.task.shapeSize,
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