var game = new GameFramework();

game.setInitCallback( function() {

    this.task = {};
    this.task.numRobots = Math.floor((Math.random()*500)+1);          // number of robots
    this.task.robotRadius = 0.5*4.0/Math.sqrt(this.task.numRobots);
    this.task.robots = [];              // array of bodies representing the robots
    this.task.goals = [];               // array of goals of form {x,y,w,h}
    this.task.blocks = [];              // array of bodies representing blocks                                          // number of robots

    this.task.impulse = 20;             // impulse to move robots by
    this.impulseV = new phys.vec2(0,0); // global impulse to control all robots

    var fixDef = new phys.fixtureDef;
    fixDef.density = 10.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;  //bouncing value

    // body definition for obstacles
    var bodyDef = new phys.bodyDef;
    bodyDef.userData = 'obstacle';
    bodyDef.type = phys.body.b2_staticBody;

    //create ground obstacles
    fixDef.shape = new phys.polyShape;

    // reshape fixture def to be horizontal bar
    fixDef.shape.SetAsBox(10, this.constants.obsThick);
    
    // create bottom wall
    bodyDef.position.Set(10, 20-this.constants.obsThick);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);

    // create top wall
    bodyDef.position.Set(10, this.constants.obsThick);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);

    // reshape fixture def to be vertical bar
    fixDef.shape.SetAsBox(this.constants.obsThick, 10);
    
    // create left wall
    bodyDef.position.Set(this.constants.obsThick, 10);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);

    // create right wall
    bodyDef.position.Set(20-this.constants.obsThick, 10);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);

    // reshape fixture def to be horizontal bar
    fixDef.shape.SetAsBox(20, this.constants.obsThick);

    // create mid lower wall
    bodyDef.position.Set(25, 6.66);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    
    // create mid upper wall
    bodyDef.position.Set(-5, 13.33);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    


    // create block
    // This defines a hexagon in CCW order.
    // http://blog.sethladd.com/2011/09/box2d-and-polygons-for-javascript.html
    bodyDef.type = phys.body.b2_dynamicBody;
    bodyDef.userData = 'workpiece';
    bodyDef.position.Set(10,16.5);
    fixDef.isSensor = false;
    var Mpoints = [ 
    {x: 1, y: 0}, 
    {x: 1/2, y: Math.sqrt(3)/2}, 
    {x: -1/2, y:Math.sqrt(3)/2},
    {x: -1, y:0}, 
    {x: -1/2, y: -Math.sqrt(3)/2}, 
    {x: 1/2, y:-Math.sqrt(3)/2}];
    var points = [];
    var SCALE = 2;
    for (var i = 0; i < Mpoints.length; i++) {
        var vec = new phys.vec2();
        vec.Set(SCALE*Mpoints[i].x, SCALE*Mpoints[i].y);
        points.push(vec);
    }
    fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
    fixDef.shape.SetAsArray(points, points.length);
    
    this.task.blocks.push( this.world.CreateBody(bodyDef));
    fixDef.density = 1.0;
    this.task.blocks[0].CreateFixture(fixDef);
    this.task.blocks[0].m_angularDamping = 5;
    this.task.blocks[0].m_linearDamping = 5;

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

    bodyDef.type = phys.body.b2_dynamicBody;
    bodyDef.userData = 'robot';
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;  //bouncing value
    fixDef.isSensor = false;
    fixDef.shape = new phys.circleShape( this.task.robotRadius ); // radius .5 robots
    for(var i = 0; i < this.task.numRobots; ++i) {
        bodyDef.position.x = (i%rowLength)*2.1*this.task.robotRadius + xoffset;
        bodyDef.position.y = Math.floor(i/rowLength)*2.1*this.task.robotRadius + yoffset;
        this.task.robots[i] = this.world.CreateBody(bodyDef);
        this.task.robots[i].CreateFixture(fixDef);
        this.task.robots[i].m_angularDamping = 10;
        this.task.robots[i].m_linearDamping = 10;  //should these be proportional to robot mass?
        //TODO: add units
    }

});

game.setDrawCallback( function() {
    drawutils.clearCanvas();

    // draw goal zone
    _.each(this.task.goals, function (g) { 
        var f = g.GetFixtureList();
        var radius = f.GetShape().GetRadius();
        var pos = g.GetPosition();
        drawutils.drawCircle( 30*pos.x, 30*pos.y,30*radius, this.constants.colorGoal, this.constants.strokeWidth );
    }.bind(this));

    //draw robots and obstacles
    for (b = this.world.GetBodyList() ; b; b = b.GetNext())
    {
        var angle = b.GetAngle()*(180/Math.PI);
        for(f = b.GetFixtureList(); f; f = f.GetNext()) {
            if (b.GetUserData() == 'goal') {
                continue; // we drew the goal earlier
            }
            if (b.GetUserData() == 'robot') {
                // draw the robots
                var radius = f.GetShape().GetRadius();
                var pos = b.GetPosition();
                drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobot,this.constants.colorRobotEdge); 
            } else if (b.GetUserData() == 'workpiece') {
                // draw the pushable object
                var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                var pos = b.GetPosition();
                var color = this.constants.colorObject;
                //drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color,angle);
                drawutils.drawPolygon(30*pos.x, 30*pos.y,30*2,6,angle,color);
            } else {
                //http://calebevans.me/projects/jcanvas/docs/polygons/
                // draw the obstacles
                var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                var pos = b.GetPosition();
                var color = this.constants.colorGoal;
                if(b.GetUserData() == 'obstacle') {
                    color = this.constants.colorObstacle;
                }
                drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
            }
        }
    }

    // draw goal zone
    _.each(this.task.goals, function (g) { 
        var pos = g.GetPosition();
        color = this.constants.colorGoal;
        drawutils.drawText(30*pos.x,30*pos.y,'Goal', 1.5, color, color)
    }.bind(this));
});

game.setOverviewCallback( function() {
    var color = 'white';

    //draw arrow from object to goal
    var pGoalArrow = [[400,495],[525,495],[525,300],[80,300],[80,100],[400,100]];
    drawutils.drawLine(pGoalArrow,this.constants.colorGoal,false,50,true);
    var aY = 20;
    var aX = 50;
    var pGoalArrow = [[400-aX,100+aY],[400,100],[400-aX,100-aY]];
    drawutils.drawLine(pGoalArrow,this.constants.colorGoal,false,50,false);
    // (←,↑,↓,→)
    if(this.mobileUserAgent){
          drawutils.drawText(300,300,'tilt screen to move object to goal', 1.5, 'white', 'white');
    }else{drawutils.drawText(300,300,'move object to goal with arrow keys', 1.5, 'white', 'white');}

    _.each(this.task.blocks, function (g) { 
        var pos = g.GetPosition();
        color = 'white';
        drawutils.drawText(30*pos.x,30*pos.y,'Object', 1.5, color, color)
    }.bind(this));

    var meanx = 0;
    var meany = 0;
    for(var i = 0; i < this.task.numRobots; ++i) {
        var pos = this.task.robots[i].GetPosition();
        meanx = meanx + pos.x/this._numrobots;
        meany = meany + pos.y/this._numrobots;
    }
    var color = this.constants.colorRobot;
    drawutils.drawRect(30*meanx,30*(meany+2), 120,30, 'rgba(240, 240, 240, 0.7)');
    drawutils.drawText(30*meanx,30*(meany+2),this.task.numRobots+' Robots', 1.5, color, color);
});

game.setUpdateCallback( function (dt, inputs) {

    inputs.forEach( function( evt ) {
        //HACKHACK
        // Note that this impulse needs to be reset *erry frame*
        // or the bots give up and go away
        if (evt.type == 'keydown') {
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
        } else if (evt.type == 'keyup') {
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
    _.each( this.task.robots, function(r) { 
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
    _.each(this.task.blocks, function (b) {
        // we use _.every because it will stop iterating on success
        _.every(this.task.goals, function (g) {
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
    drawutils.drawText(300,250, 'You finished in '+ (this._timeElapsed/1000).toFixed(2) +' seconds!', 2, color, color)
    drawutils.drawText(300,350, 'Loading results page...', 2, color, color)

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
