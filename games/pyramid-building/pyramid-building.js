(function($,phys,GameFramework, Box2D, drawutils, mathutils) {
    'use strict';
    function URFP( x ) { /* jshint expr:true */ x; }
    URFP(Box2D);

    var game = new GameFramework();

    game.setInitCallback( function() {
        /*jshint camelcase:false */
        /* ^ we do this because the Box2D bindings are fugly. */

        var i;

        this.task = {};
        this.task.noise =(10*Math.random()).toFixed(1);  //add some noise: 0.0 to 10.0
        this.task.numRobots = 8;
        this.task.robots = [];          // array of bodies representing the robots
        this.task.goals = [];           // array of goals of form {x,y,w,h}
        this.task.blocks = [];          // array of bodies representing blocks                                          // number of robots
        this.mX = 0;
        this.mY = 0;
        this.impulseV = new phys.vec2(0,0);
        this.task.impulse = 50;
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;

        // better: take number * 200% of control power
        //atto meters:  1 nanocar wheel weighs 720 g/mol = 7.2*10^-23 g, assume nanocar is 6 times that = 4.2*10&-22
        // dragster moves 0.014 mm/hr
        // fixture definition for obstacles
        //http://arxiv.org/pdf/cond-mat/0506038.pdf
        //http://research.chem.ucr.edu/groups/bartels/publications/prl79p697.pdf  (talks about pushing & pulling)
        var fixDef = new phys.fixtureDef();
        fixDef.density = 20.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value

        function makeBox( world, x, y, xThickness, yThickness) {
            var fixDef = new phys.fixtureDef();
            fixDef.density = 20.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.shape = new phys.polyShape();
            fixDef.shape.SetAsBox(xThickness, yThickness);

            // body definition for obstacles
            var bodyDef = new phys.bodyDef();
            bodyDef.userData = 'obstacle';
            bodyDef.type = phys.body.b2_staticBody;
            bodyDef.position.Set(x, y);
        
            world.CreateBody(bodyDef).CreateFixture(fixDef);
        }

            // create bottom wall
        makeBox(    this.world,
                    10, 20 - this.constants.obsThick,
                    10, this.constants.obsThick);

        // create top wall
        makeBox(    this.world,
                    10, this.constants.obsThick,
                    10, this.constants.obsThick);
        
        // create left wall
        makeBox(    this.world,
                    this.constants.obsThick, 10,
                    this.constants.obsThick, 10);

        // create right wall
        makeBox(    this.world,
                    20 - this.constants.obsThick, 10,
                    this.constants.obsThick, 10);
        
        // create pyramid floor
        makeBox(    this.world,
                    10, 10,
                    4, this.constants.obsThick);

        // create pyramid blocks
        this._blocks = [];
        var bodyDef = new phys.bodyDef();
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'workpiece';
        fixDef.shape = new phys.polyShape();
        fixDef.shape.SetAsBox( 0.5, 0.5);
        fixDef.density = 5.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        for( i = 0; i < 6; ++i) {
            bodyDef.position.x = 4.5 + 2*i;
            bodyDef.position.y = 15;
            var block = this.world.CreateBody(bodyDef);
            block.CreateFixture(fixDef);
            block.m_angularDamping = 5;
            block.m_linearDamping = 5;
            block.atGoal = false;
            this.task.blocks.push(block);
        }

        // create some robots
        var xoffset = 8;
        var yoffset = 4;
        this._robots = [];
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'robot';
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        fixDef.shape = new phys.circleShape( 0.5 ); // radius .5 robots
        for( i = 0; i < this.task.numRobots; ++i) {
            bodyDef.position.x = (i%4)*1.2 + xoffset;
            bodyDef.position.y = 1.2*Math.floor( i/4 ) + yoffset;
            var r = this.world.CreateBody(bodyDef);
            r.CreateFixture(fixDef);
            r.m_angularDamping = 10;
            r.m_linearDamping = 10;
            this.task.robots.push(r);
        }

        // create goals
        var goalPositions = [   {x:10.0, y:7.2},
                                {x:9.5, y:8.2},
                                {x:10.5, y:8.2},
                                {x:9, y:9.2},
                                {x:10.0,y:9.2},
                                {x:11,y:9.2}];
        fixDef.isSensor = true;
        fixDef.shape = new phys.polyShape();
        fixDef.shape.SetAsBox( 0.2, 0.2);
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        goalPositions.forEach( function (gp) {
            var body;
            bodyDef.position.Set(gp.x,gp.y);
            body = this.world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);
            this.task.goals.push(body);
        }.bind(this));
    });


    game.setDrawCallback( function () {
        drawutils.clearCanvas();

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
            drawutils.drawEmptyRect(30*pos.x, 30*pos.y,
                                    30* X*2.2, 30 * Y*2.2,
                                    this.constants.colorGoal, 0,
                                    this.constants.strokeWidth);
            this.task.blocks.forEach( function (b) {
                var blockAABB = b.GetFixtureList().GetAABB();
                if ( blockAABB.Contains( g.GetFixtureList().GetAABB()) ) {
                    b.atGoal = true;
                }
            }.bind(this));  
        }.bind(this));

        //draw robots and obstacles
        for (var b = this.world.GetBodyList() ; b; b = b.GetNext()) {
            var pos = b.GetPosition();
            var X;
            var Y;
            var color;

            var angle = b.GetAngle()*(180/Math.PI);
            for(var f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (b.GetUserData() === 'goal') {
                    continue;
                } else if (b.GetUserData() === 'robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
                } else if (b.GetUserData() === 'workpiece') {
                    // draw the objects
                    X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    
                    color = this.constants.colorObject;
                    if (b.atGoal === true) {
                        color = this.constants.colorObjectAtGoal;
                    }
                    drawutils.drawRect( 30*pos.x, 30*pos.y,
                                        30* X, 30 * Y,
                                        color,angle,this.constants.colorObjectEdge,0,this.constants.strokeWidth);
                } else {
                    // draw the obstacles
                    X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;                    
                    color = this.constants.colorObject;
                    if(b.GetUserData() === 'obstacle') {
                        color = this.constants.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
                }
            }
        }
    });

    game.setOverviewCallback( function() {
        var color = 'white';
        var meanx = 0;
        var miny =  Number.MAX_VALUE;
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


        meanx = 0;
        miny =  Number.MAX_VALUE;
        meany = 0;
        for(var i = 0; i < this.task.numRobots; ++i) {
            var pos = this.task.robots[i].GetPosition();
            meanx = meanx + pos.x/this.task.numRobots;
            meany = meany + pos.y/this.task.numRobots;
            if( pos.y < miny) {
                miny = pos.y;
            }
        }
        color = this.constants.colorRobot;
        drawutils.drawText(30*(meanx),30*(miny-1),'Robots', 1.5, color, color);

        color = this.constants.colorObstacle;
        drawutils.drawText(300,500,'Move Blocks to Goals', 1.5, color, color);
        if(this.mobileUserAgent) {
            drawutils.drawText(300,530,'by tilting screen (←,↑,↓,→)', 1.5, color, color);
        } else {
            drawutils.drawText(300,530,'with arrow keys (←,↑,↓,→)', 1.5, color, color);
        }
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
        this.impulseV.x *=  normalizer;    
        this.impulseV.y *=  normalizer; 
        // apply the user force to all the robots
        var brownianImpulse = new phys.vec2(0,0); 
        var mag = 0;
        var ang = 0;
        this.task.robots.forEach( function(r) { 
            //apply Brownian noise:  0-100, maximum force we can apply is 50, so take #*200%
            mag = this.task.noise*10*Math.random();
            ang = 2*Math.PI*Math.random();
            brownianImpulse.x = mag*Math.cos(ang) + this.impulseV.x ;
            brownianImpulse.y = mag*Math.sin(ang) + this.impulseV.y ;
            r.ApplyForce( brownianImpulse, r.GetWorldPoint( this.constants.zeroRef ) );
        }.bind(this) );
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

         // next, post our results to the server.
         /*
        $.ajax( { type: 'POST',
                  url: '/result',
                  dataType: 'json',
                  async: false,
                  data: {
                            task:this.taskName,
                            mode:this.taskMode,
                            runtime:this._runtime,
                            numrobots:this._numrobots,
                            participant:'web',
                            agent: navigator.userAgent,
                            aborted:false
                        }
        });
        this.isTaskComplete = true;
        
        // 1. display plot in a colorbox
        // 2. display buttons for Play Again, all results, task list
        // 3. display: 'you have completed x of 4 tasks.  Play again!' <or> 'Level cleared -- you may play again to increase your score'
        var currTaskName = this.taskName;

        var c = $('.canvas');
        $.get('/result.json?task='+currTaskName, function( data ) {
            var data = JSON.parse(data);
            // draw white  box to to give a background for plot
            drawutils.drawRect(300,300, 590,590, 'white');//rgba(200, 200, 200, 0.8)');
            // at this point, we do not reschedule, and the task ends.
            numMyResults = swarmcontrol.results.singlePlot(c,data.results);
            $('.span8').append('<button class='btn btn-success play-again-button' style='position: relative; left: 100px; top: -110px;' onclick='location.reload(true);'><h3>Play again!</h3></button>');
        
            /*
        function drawMeritBadges(divname,numMyResults){
            var numPres = numMyResults;
            var element=  document.getElementById(divname);
            var maxstars = 5;
            var imgsize = '25';
            if(numPres>5){ 
                strImage = '/assets/soft_edge_yellow_star.png'
                $('.span8').append('<img src= '+strImage+' width='+imgsize+' height='+imgsize+' style='position: relative; left: 120px; top: -110px;'><h3 style='position: relative; left: 145px; top: -175px;'>x'+numPres+'</h3>');
            
            }else{
                for( var i = 0; i<maxstars; i++){
                    var strImage = '/assets/soft_edge_empty_star.png';
                    if( numPres >i) {
                        strImage = '/assets/soft_edge_yellow_star.png';
                    }
                    $('.span8').append('<img src= '+strImage+' width='+imgsize+' height='+imgsize+' style='position: relative; left: 120px; top: -110px;'>');
                }
            }      
        } 

        drawMeritBadges('canvasID',numMyResults);
        


        var k =_.keys(swarmcontrol.prettyTaskNames);
        var nextTask = k.indexOf(currTaskName) + 1;
        if(nextTask >= k.length) {
            nextTask = 0;
        }
        newTaskPath = 'parent.location='./' + k[nextTask] + ''';
        console.log(newTaskPath);

        $('.span8').append('<button class='btn btn-success next-Task-button' style='position: relative; left: 140px; top: -110px;' onclick='+newTaskPath+'>► Next Task</button>');
        });
        */
    });

    $(window).on('load', function () {
        game.init( $('#canvas') );
        game.run();
    });
})($,phys,GameFramework, Box2D, drawutils, mathutils);