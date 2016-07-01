var game = new GameFramework();

game.setPregameCallback( function() {
    $('.mode-button').prop('disabled',true);
});

game.setInitCallback( function () {
    this.task = {};
    this.task.modes = ['attractive','repulsive','global'];
    this.task.mode = 'repulsive';
    this.task.controllerActive = false;
    this.task.repulsing = false;
    this.task.attracting = false;
    this.task.numRobots = 100;
    this.task.robotRadius=  0.5;
    this.task.robots = [];          // array of bodies representing the robots
    this.task.goals = [];           // array of goals of form {x,y,w,h}
    this.task.blocks = [];          // array of bodies representing blocks
    this.task.numblocksCollected = 0;
    this.task.numBlocksTotal = 50;
    this.mX = 0;
    this.mY = 0;
    this.impulseV = new phys.vec2(0,0)

    $('#button-'+this.task.mode).addClass('btn-success');
    _.each(this.task.modes, function (mode) {
        $('#button-' + mode).click(function() {
            this.task.mode = mode;
            $('.mode-button').removeClass('btn-success');
            $('#button-'+mode).addClass('btn-success');
        }.bind(this));
    }.bind(this));

    function makeBox( world, x, y, xThickness, yThickness) {
        var fixDef = new phys.fixtureDef;
        fixDef.density = 20.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        fixDef.shape = new phys.polyShape;
        fixDef.shape.SetAsBox(xThickness, yThickness);

        // body definition for obstacles
        var bodyDef = new phys.bodyDef;
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
    
    // create mid lower wall    
    makeBox(    this.world,
                25, 6.66,
                20, this.constants.obsThick);

    // create mid upper wall
    makeBox(    this.world,
                -5, 13.33,
                20, this.constants.obsThick);

    // create food blocks
    var fixDef = new phys.fixtureDef;
    var bodyDef = new phys.bodyDef;
    bodyDef.type = phys.body.b2_dynamicBody;
    bodyDef.userData = 'workpiece';
    fixDef.shape = new phys.polyShape();
    fixDef.shape.SetAsBox( 0.3, 0.3);
    fixDef.density = 5.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;  //bouncing value
    for(var i = 0; i < this.task.numBlocksTotal; ++i) {
        bodyDef.position.x = (0.3 + this.constants.obsThick) + (19 * Math.random());
        bodyDef.position.y = (0.3 + this.constants.obsThick) + (19 * Math.random());

        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fixDef);
        body.m_angularDamping = 5;
        body.m_linearDamping = 5;
        this.task.blocks.push(body);
    }

    // create some robots
    var fixDef = new phys.fixtureDef;
    bodyDef = new phys.bodyDef;
    this.task.robotRadius = 0.5*6.0/Math.sqrt(this.task.numRobots);
    var rowLength = Math.floor(7/(2*this.task.robotRadius));
    var xoffset = this.task.robotRadius+0.5;
    var yoffset = 13.5+this.task.robotRadius;
    bodyDef.type = phys.body.b2_dynamicBody;
    bodyDef.userData = 'robot';
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;  //bouncing value
    fixDef.isSensor = false;
    fixDef.shape = new phys.circleShape( this.task.robotRadius ); 
    for(var i = 0; i < this.task.numRobots; ++i) {
        //random position
        bodyDef.position.x = xoffset + 9*Math.random();
        bodyDef.position.y = yoffset + 6*Math.random();
        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fixDef);
        body.m_angularDamping = 10;
        body.m_linearDamping = 10;
        body.foodx = -1;
        body.foody = -1;
        this.task.robots.push(body);
    }

    
    var contactListener = new Box2D.Dynamics.b2ContactListener;
    contactListener.BeginContact = function(contact, manifold) {
        if( contact.m_fixtureA.m_body.m_userData == 'robot' &&
            contact.m_fixtureB.m_body.m_userData == 'workpiece')
        {
            contact.m_fixtureA.m_body.m_userData = 'contact';
            contact.m_fixtureA.m_shape.m_radius = contact.m_fixtureA.m_shape.m_radius*1.5;
            contact.m_fixtureB.m_body.m_userData = 'empty';
            contact.m_fixtureA.m_body.foodx = contact.m_fixtureB.m_body.GetPosition().x;
            contact.m_fixtureA.m_body.foody = contact.m_fixtureB.m_body.GetPosition().y;
        } else if(  contact.m_fixtureA.m_body.m_userData == 'workpiece' &&
                    contact.m_fixtureB.m_body.m_userData == 'robot') 
       {
            contact.m_fixtureB.m_body.m_userData = 'contact';
            contact.m_fixtureA.m_body.m_userData = 'empty';
            contact.m_fixtureB.m_shape.m_radius = contact.m_fixtureB.m_shape.m_radius*1.5;
            contact.m_fixtureB.m_body.foodx = contact.m_fixtureA.m_body.GetPosition().x;
            contact.m_fixtureB.m_body.foody = contact.m_fixtureA.m_body.GetPosition().y;
       }
    };
    this.world.SetContactListener(contactListener);
    
    
    // create the goal
    bodyDef.type = phys.body.b2_dynamicBody;
    bodyDef.userData = 'goal';
    bodyDef.position.Set(3.35,16.5);
    this.task.goals.push( this.world.CreateBody(bodyDef) );
    fixDef.isSensor = true;
    fixDef.shape = new phys.circleShape(3.25); 
    this.task.goals[0].CreateFixture(fixDef);    
});

game.setDrawCallback( function () {
    drawutils.clearCanvas();

    // draw goal zone
    var collectionProgress = this.task.numblocksCollected / this.task.numBlocksTotal;
    var color = this.constants.colorGoal;
    _.each(this.task.goals, function (g) { 
        var pos = g.GetPosition();
        drawutils.drawRect(30*pos.x,31*pos.y, 75,60, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
        drawutils.drawText(30*pos.x,30*pos.y,'Home', 1.5, color, color)
        drawutils.drawText(30*pos.x,32*pos.y,(100*collectionProgress).toFixed(0)+'%', 1.5, color, color)
        drawutils.drawRect(30*pos.x,28*pos.y, 75,30, 'rgba(95,96,98, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
        drawutils.drawRect(30*pos.x-75*(1-collectionProgress)/2,28*pos.y, 75*collectionProgress,30, 'rgba(97,197,97, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
        drawutils.drawRect(30*pos.x+(75/2-0.1*75),28*pos.y, 5,30, 'rgba(255,0,0, 0.7)',0,'rgba(255, 0, 0, 0.7)',1);
        var f = g.GetFixtureList();
        var radius = f.GetShape().GetRadius();
        drawutils.drawCircle( 30*pos.x, 30*pos.y,30*radius, this.constants.colorGoal, this.constants.strokeWidth );
    }.bind(this));

    //draw robots and obstacles
    for (var b = this.world.GetBodyList() ; b; b = b.GetNext())
    {
        var angle = b.GetAngle()*(180/Math.PI);
        for(f = b.GetFixtureList(); f; f = f.GetNext()) {
            var bType = b.GetUserData();
            var angle = b.GetAngle()*(180/Math.PI);
            if (bType == 'goal') {
                continue;
            } else  if ( bType == 'robot') {
                // draw the robots
                var radius = f.GetShape().GetRadius();
                var pos = b.GetPosition();
                drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius,
                                        this.constants.colorRobot,
                                        this.constants.colorRobotEdge);
                if (this.task.mode == 'attractive' || this.task.mode == 'repulsive'){
                    drawutils.drawLine([[30*(-0.2+pos.x), 30*pos.y],[30*(0.2+pos.x), 30*pos.y]],'darkblue',true,this.strokeWidthThick); // minus
                }
                if (this.task.mode == 'repulsive' ){
                    drawutils.drawLine([[30*(pos.x), 30*(-0.2+pos.y)],[30*(pos.x), 30*(0.2+pos.y)]],'darkblue',true,this.strokeWidthThick); //vertical
                }
            } else if ( bType == 'workpiece') {
                // draw the object
                var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                var pos = b.GetPosition();
                var color = this.constants.colorObject;
                if (b.atGoal == true) {
                    color = this.constants.colorObjectAtGoal;
                }
                drawutils.drawRect(30*pos.x, 30*pos.y, 30*X, 30 * Y,
                                    color,angle,this.constants.colorObjectEdge,
                                    this.constants.strokeWidth);
            } else if ( bType == 'contact') {
                var radius = f.GetShape().GetRadius();
                var pos = b.GetPosition();
                if( b.foodx != -1  && b.foody != -1)
                {
                    pos.x = (pos.x+b.foodx)/2;
                    pos.y = (pos.y+b.foody)/2;
                    b.SetPosition( new Box2D.Common.Math.b2Vec2(pos.x,pos.y));
                    b.foodx = -1; 
                    b.foody = -1;   
                }
                //draw a robot with a food particle inside
                drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, this.constants.colorRobotAtGoal,this.constants.colorRobotEdge); 
                drawutils.drawRect(30*pos.x, 30*pos.y, 30*0.6, 30 * 0.6, this.constants.colorObjectAtGoal,0,this.constants.colorObjectEdge,this.constants.strokeWidth);                
            } else if ( bType == 'obstacle') {
                // draw the obstacles
                var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                var pos = b.GetPosition();
                color = this.constants.colorObstacle;
                drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
            } else if (b.GetUserData() == 'empty') {
                // HACKHACK would be better to do in the update callback, but here we iterate anyways
                this.world.DestroyBody(b);
            }
        }
    }

    if( this.task.mode == 'global')
    {
        //draw arrow
        var ArrX = [-1,-1,0.2,0.2,1,0.2,0.2,-1,-1];
        var ArrY = [0,1/4,1/4,1/2,0,-1/2,-1/4,-1/4,0];
        // Add the points from the array to the object
        var angle = Math.atan2(this._mY - 10, this._mX-10);
        var pts = [];
        for (var p=0; p<ArrX.length; p+=1) {
            pts.push([30*(10+Math.cos(angle)*ArrX[p]-Math.sin(angle)*ArrY[p]),30*(10+Math.sin(angle)*ArrX[p]+Math.cos(angle)*ArrY[p])]);
        } 
        drawutils.drawLine(pts,'rgba(0, 0, 153, 0.5)',true,18,false);
    }else{
        // draw controller position.  James asked for this, but the lag behind the cursor position is very noticeable, so I commented it out.
        drawutils.drawLine([ [30*(-0.2+this._mX), 30*this._mY],[30*(0.2+this._mX), 30*this._mY]],'darkblue',true); // minus
        drawutils.drawLine([    [   30*(this._mX),
                                    30*(-0.2+this._mY)],
                                [   30*(this._mX),
                                    30*(0.2+this._mY)]
                            ],'darkblue',true); //vertical
    }
});


game.setOverviewCallback( function() {
    var color = 'white';

    for (var i = 0; i < 5; i++) {
        var pos = this.task.blocks[i].GetPosition();
        if( pos.x < 16 && pos.y < 13 && pos.y > 5){
            color = this.constants.colorObjectEdge;
            drawutils.drawRect(30*(pos.x+1.7),30*pos.y, 80,22, 'rgba(240, 240, 240, 0.4)',0,'rgba(240, 240, 240, 0.4)',0);
            drawutils.drawText(30*(pos.x+1.7),30*pos.y,'←Food', 1.5, color, color);
        }
    }
    
    color = this.constants.colorObject;
    drawutils.drawRect(300,560, 470,30, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',0);
    if(this.mobileUserAgent){
        drawutils.drawText(300,560, 'use touchscreen to bring 90% of food home', 1.5, color, color);
    } else {
        drawutils.drawText(300,560, 'use your mouse to bring 90% of food home', 1.5, color, color);
    }

    var strInstruction = '';
    var strControlMode = 'mouse click';
    if(this.mobileUserAgent)
        {strControlMode = 'your touch';}
    switch( this.task.mode ) {
        case 'attractive': strInstruction ='Robots are attracted to '+strControlMode; break;
        case 'repulsive' : strInstruction ='Robots are repulsed from '+strControlMode;break;
        case 'global' : strInstruction ='Robots move in direction of '+strControlMode;break;
    }
    drawutils.drawRect(300,65, 420,60, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',0);
    drawutils.drawText(300,80,strInstruction, 1.5, color, color)
    drawutils.drawText(300,50,this.task.mode+' control:', 1.5, 'black', 'black')

    var meanx = 0;
    var miny =  Number.MAX_VALUE;
    var minx =  Number.MAX_VALUE;
    var meany = 0;
    for(var i = 0; i < this.task.numRobots; ++i) {
        var pos = this.task.robots[i].GetPosition();
        meanx = meanx + pos.x/this.task.numRobots;
        meany = meany + pos.y/this.task.numRobots;
        if( pos.y < miny)
            {miny = pos.y;}
        if( pos.x < minx)
            {minx = pos.x;}
    }
    color = this.constants.colorRobot;
    drawutils.drawText(30*(minx-2.3),30*(meany- 0.55),'Robots→', 1.5, color, color);
});

game.setUpdateCallback( function (dt, inputs) {
    inputs.forEach( function( evt ) {

        switch (evt.type) {
            case 'mousedown': this.controllerActive = true; break;
            case 'mouseup' : this.controllerActive = false; break;
            case 'mousemove' :  this.mX = evt.x;
                                this.mY = evt.y;
                                break;
        }
    }.bind(this));

    var goalPosition = this.task.goals[0].GetPosition();
    var goalRadius = this.task.goals[0].GetFixtureList().GetShape().GetRadius();

    _.each( this.task.robots, function(r) {
        r.atGoal = false;
        if( r.GetUserData() == 'contact'){
            var roboPosition = r.GetPosition();
            
            if( mathutils.lineDistance( goalPosition.x,
                                        goalPosition.y,
                                        roboPosition.x,
                                        roboPosition.y) < goalRadius) { 
                r.SetUserData('robot');
                r.atGoal = true;
                r.GetFixtureList().GetShape().SetRadius(this.task.robotRadius);
                this.task.numblocksCollected++;
            }
        }
    }.bind(this) );

    if (this.controllerActive) {
        if (this.task.mode == "global" ) {
            var angle = Math.atan2(this.mY - 10, this.mX-10);
            this.impulseV.x = 40* Math.cos(angle);
            this.impulseV.y = 40* Math.sin(angle);
            _.each( this.task.robots, function(r) {                                     
                r.ApplyForce( this.impulseV, r.GetWorldPoint( this.constants.zeroRef ) );
            }.bind(this));
        } else {
            _.each( this.task.robots, function(r) { 
                var rpos = r.GetPosition();             
                var dx = this.mX - rpos.x;
                var dy = this.mY - rpos.y;
                var distSq = dx*dx + dy*dy;
                var mag = Math.sqrt(distSq);
                var h2 = 4;
                var forceM = 100*distSq/Math.pow(distSq + h2,2);
                this.impulseV.x = 20*dx/mag*forceM || 0;
                this.impulseV.y = 20*dy/mag*forceM || 0;
                if (this.task.mode =='repulsive') {
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
    // players must collect at leaast 90% of blocks to win
    return (this.task.numblocksCollected / this.task.numblocksTotal ) >= 0.9;
});

game.setLoseTestCallback( function() {
    // in this game, we can't lose--no time constraints or anything.
    return false;
});

$(window).on('load', function () {
    game.init( $("#canvas") );
    game.run();
});



/*
var varyingControlTask = _.extend({}, baseTask, attractiveController, repulsiveController, globalController, {    

    setupInstructions: function ( options ){
        'use strict';
        var that = this;
        this.instructions = 'With your mouse make robots (blue) bring at least 90% of food (green) home (outlined).';
        if( that.mobileUserAgent ){
            this.instructions = 'Touch the screen to make robots (blue)  bring at least 90% of food (green) home (outlined).';
        }
        this.instructions += 'Play all '+that._taskModes.length+' control styles!' +'<div class="btn-group">';
        _.each(that._taskModes, function (m) {
            that.instructions += '<button class="btn btn-default mode-button" title="choose control mode" id="button-'+m+'">'+m+'</button>';
        });
        that.instructions += '</div>';
        $('#task-instructions').empty();
        $('#task-instructions').append( $( '<h4>How to play</h4><p>' + this.instructions + '<p>') );
        //set the inital mode
        $('#button-'+that.taskMode).addClass('btn-success');
        _.each(that._taskModes, function (m) {
            $('#button-'+m).click(function() {
                that.taskMode = m;
                $('.mode-button').removeClass('btn-success');
                $('#button-'+m).addClass('btn-success');
            });
        });
    },


    setupTask: function( options ) { 
        'use strict';
        this.taskMode = this._taskModes[ Math.floor(Math.random()*this._taskModes.length) ];
        switch (this.taskMode) {
            case 'attractive': this.update = this.attractiveUpdate; break;
            case 'repulsive': this.update = this.repulsiveUpdate; break;
            case 'global': this.update = this.globalUpdate; break;
            default: break;
        }

        // fixture definition for obstacles
        var fixDef = new phys.fixtureDef;
        fixDef.density = 20.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value

        // body definition for obstacles
        var bodyDef = new phys.bodyDef;
        bodyDef.userData = 'obstacle';
        bodyDef.type = phys.body.b2_staticBody;

        //create ground obstacles
        fixDef.shape = new phys.polyShape;

        // reshape fixture def to be horizontal bar
        fixDef.shape.SetAsBox(10, this.obsThick);
        
        // create bottom wall
        bodyDef.position.Set(10, 20-this.obsThick);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);

        // create top wall
        bodyDef.position.Set(10, this.obsThick);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);

        // reshape fixture def to be vertical bar
        fixDef.shape.SetAsBox(this.obsThick, 10);
        
        // create left wall
        bodyDef.position.Set(this.obsThick, 10);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);

        // create right wall
        bodyDef.position.Set(20-this.obsThick, 10);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);

        // reshape fixture def to be horizontal bar
        fixDef.shape.SetAsBox(20, this.obsThick);

        // create mid lower wall
        bodyDef.position.Set(25, 6.66);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);
        
        // create mid upper wall
        bodyDef.position.Set(-5, 13.33);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);
        
        // create food blocks
        this._blocks = [];
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'workpiece';
        fixDef.shape = new phys.polyShape();
        fixDef.shape.SetAsBox( 0.3, 0.3);
        fixDef.density = 5.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        for(var i = 0; i < this._numblocksTotal; ++i) {
            do{
            bodyDef.position.x = 0.5+19*Math.random();
            bodyDef.position.y = 0.5+19*Math.random();
            }while(   bodyDef.position.x > 0 
                   && bodyDef.position.x<10
                   && bodyDef.position.y>13
                   && bodyDef.position.y<20)
            this._blocks[i] = this._world.CreateBody(bodyDef);
            this._blocks[i].CreateFixture(fixDef);
            this._blocks[i].m_angularDamping = 5;
            this._blocks[i].m_linearDamping = 5;
        }

        // create some robots
        this._robotRadius = 0.5*6.0/Math.sqrt(this._numrobots);
        var rowLength = Math.floor(7/(2*this._robotRadius));
        var xoffset = this._robotRadius+0.5;
        var yoffset = 13.5+this._robotRadius;
        this._robots = [];
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'robot';
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        fixDef.isSensor = false;
        fixDef.shape = new phys.circleShape( this._robotRadius ); 
        for(var i = 0; i < this._numrobots; ++i) {
            //random position
            bodyDef.position.x = xoffset + 9*Math.random();
            bodyDef.position.y = yoffset + 6*Math.random();
            this._robots[i] = this._world.CreateBody(bodyDef);
            this._robots[i].CreateFixture(fixDef);
            this._robots[i].m_angularDamping = 10;
            this._robots[i].m_linearDamping = 10;
            this._robots[i].foodx = -1;
            this._robots[i].foody = -1;
        }

        var contactListener = new Box2D.Dynamics.b2ContactListener;
        contactListener.BeginContact = function(contact, manifold) {

           if(   contact.m_fixtureA.m_body.m_userData == 'robot' &&
                 contact.m_fixtureB.m_body.m_userData == 'workpiece')
            {
                contact.m_fixtureA.m_body.m_userData = 'contact';
                contact.m_fixtureA.m_shape.m_radius = contact.m_fixtureA.m_shape.m_radius*1.5;
                contact.m_fixtureB.m_body.m_userData = 'empty';
                contact.m_fixtureA.m_body.foodx = contact.m_fixtureB.m_body.GetPosition().x;
                contact.m_fixtureA.m_body.foody = contact.m_fixtureB.m_body.GetPosition().y;
            }
           else if( contact.m_fixtureA.m_body.m_userData == 'workpiece' &&
                 contact.m_fixtureB.m_body.m_userData == 'robot') 
           { 
            contact.m_fixtureB.m_body.m_userData = 'contact';
            contact.m_fixtureA.m_body.m_userData = 'empty';
            contact.m_fixtureB.m_shape.m_radius = contact.m_fixtureB.m_shape.m_radius*1.5;
            contact.m_fixtureB.m_body.foodx = contact.m_fixtureA.m_body.GetPosition().x;
            contact.m_fixtureB.m_body.foody = contact.m_fixtureA.m_body.GetPosition().y;
           }
        };
        this._world.SetContactListener(contactListener);
        
        // create the goal
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'goal';
        bodyDef.position.Set(3.35,16.5);
        this._goals.push( this._world.CreateBody(bodyDef) );
        fixDef.isSensor = true;
        fixDef.shape = new phys.circleShape(3.25); 
        this._goals[0].CreateFixture(fixDef);
        },


        setupController: function ( options ) {
            'use strict';
            var that = this;
            switch( that.taskMode ) {
                case 'attractive': that.setupAttractiveController(options); break;
                case 'repulsive' : that.setupRepulsiveController(options);break;
                case 'global' : that.setupGlobalController(options);break;
            }
        },

        evaluateCompletion: function( options ) {
        'use strict';
        return (this._numblocksCollected/this._numblocksTotal)>=0.9;
    },

    draw: function() {
        'use strict';
        drawutils.clearCanvas();
        var that = this;

        //initialize robots to not be at goal
        _.each( that._robots, function(r) {
            r.atGoal = false;
            if( r.GetUserData() == 'contact'){
                var roboPosition = r.GetPosition();
                var goalPosition = that._goals[0].GetPosition();
                if( mathutils.lineDistance( goalPosition.x,goalPosition.y,roboPosition.x,roboPosition.y) < that._goals[0].GetFixtureList().GetShape().GetRadius()) { 
                    r.SetUserData('robot');
                    r.GetFixtureList().GetShape().SetRadius(that._robotRadius);
                    that._numblocksCollected++;
                }
            }
        });

        // draw goal zone
        _.each(that._goals, function (g) { 
            var f = g.GetFixtureList();
            var radius = f.GetShape().GetRadius();
            var pos = g.GetPosition();
            drawutils.drawCircle( 30*pos.x, 30*pos.y,30*radius, that.colorGoal, that.strokeWidth );
        });

        if(that._startTime == null){
            switch (that.taskMode) {
                case 'attractive': that.update = that.attractiveUpdate; break;
                case 'repulsive': that.update = that.repulsiveUpdate; break;
                case 'global': that.update = that.globalUpdate; break;
                default: break;
            }
            that.setupController(that._options);
        }else{
            $('.mode-button').prop('disabled',true);
        }

        
        //draw robots and obstacles
        for (b = this._world.GetBodyList() ; b; b = b.GetNext())
        {
            var angle = b.GetAngle()*(180/Math.PI);
            for(f = b.GetFixtureList(); f; f = f.GetNext()) {
                if (b.GetUserData() == 'goal') {
                    continue;
                }
                if (b.GetUserData() == 'robot') {
                    // draw the robots
                    var radius = f.GetShape().GetRadius();
                    var pos = b.GetPosition();
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, that.colorRobot,that.colorRobotEdge); 
                    if (that.taskMode == 'attractive' || that.taskMode == 'repulsive'){
                        drawutils.drawLine([[30*(-0.2+pos.x), 30*pos.y],[30*(0.2+pos.x), 30*pos.y]],'darkblue',true,that.strokeWidthThick); // minus
                    }
                    if (that.taskMode == 'repulsive' ){
                        drawutils.drawLine([[30*(pos.x), 30*(-0.2+pos.y)],[30*(pos.x), 30*(0.2+pos.y)]],'darkblue',true,that.strokeWidthThick); //vertical
                    }
                } else if (b.GetUserData() == 'workpiece') {
                    // draw the object
                    var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    var pos = b.GetPosition();
                    var color = that.colorObject;
                    if (b.atGoal == true)
                        {color = that.colorObjectAtGoal;}
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30*X, 30 * Y, color,angle,that.colorObjectEdge,that.strokeWidth);
                } else if (b.GetUserData() == 'empty') {
                    that._world.DestroyBody(b);
                }else if (b.GetUserData() == 'contact') {
                    var radius = f.GetShape().GetRadius();
                    var pos = b.GetPosition();
                    if( b.foodx != -1  && b.foody != -1)
                    {
                        pos.x = (pos.x+b.foodx)/2;
                        pos.y = (pos.y+b.foody)/2;
                        b.SetPosition( new Box2D.Common.Math.b2Vec2(pos.x,pos.y));
                        b.foodx = -1; 
                        b.foody = -1;   
                    }
                    //draw a robot with a food particle inside
                    drawutils.drawRobot( 30*pos.x, 30*pos.y,angle, 30*radius, that.colorRobotAtGoal,that.colorRobotEdge); 
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30*0.6, 30 * 0.6, that.colorObjectAtGoal,0,that.colorObjectEdge,that.strokeWidth);
                }else {
                    // draw the obstacles
                    var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    var pos = b.GetPosition();
                    var color = that.colorGoal;
                    if(b.GetUserData() == 'obstacle') {
                        color = that.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);
                }
            }
        }
        
        if( that.taskMode == 'global')
        {
            //draw arrow
            var ArrX = [-1,-1,0.2,0.2,1,0.2,0.2,-1,-1];
            var ArrY = [0,1/4,1/4,1/2,0,-1/2,-1/4,-1/4,0];
            // Add the points from the array to the object
            var angle = Math.atan2(that._mY - 10, that._mX-10);
            var pts = [];
            for (var p=0; p<ArrX.length; p+=1) {
              pts.push([30*(10+Math.cos(angle)*ArrX[p]-Math.sin(angle)*ArrY[p]),30*(10+Math.sin(angle)*ArrX[p]+Math.cos(angle)*ArrY[p])]);
          }
          drawutils.drawLine(pts,'rgba(0, 0, 153, 0.5)',true,18,false);
        }else{
            // draw controller position.  James asked for this, but the lag behind the cursor position is very noticeable, so I commented it out.
            drawutils.drawLine([[30*(-0.2+this._mX), 30*this._mY],[30*(0.2+this._mX), 30*this._mY]],'darkblue',true); // minus
            drawutils.drawLine([[30*(this._mX), 30*(-0.2+this._mY)],[30*(this._mX), 30*(0.2+this._mY)]],'darkblue',true); //vertical
        }

        // draw goal zone
        _.each(that._goals, function (g) { 
            var pos = g.GetPosition();
            color = that.colorGoal;
            drawutils.drawRect(30*pos.x,31*pos.y, 75,60, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
            drawutils.drawText(30*pos.x,30*pos.y,'Home', 1.5, color, color)
            drawutils.drawText(30*pos.x,32*pos.y,(100*that._numblocksCollected/that._numblocksTotal).toFixed(0)+'%', 1.5, color, color)
            drawutils.drawRect(30*pos.x,28*pos.y, 75,30, 'rgba(95,96,98, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
            drawutils.drawRect(30*pos.x-75*(1-that._numblocksCollected/that._numblocksTotal)/2,28*pos.y, 75*that._numblocksCollected/that._numblocksTotal,30, 'rgba(97,197,97, 0.7)',0,'rgba(240, 240, 240, 0.7)',1);
            drawutils.drawRect(30*pos.x+(75/2-0.1*75),28*pos.y, 5,30, 'rgba(255,0,0, 0.7)',0,'rgba(255, 0, 0, 0.7)',1);
        });
        // draw text before game starts
        if(that._startTime == null){
            
        }
    }
});
*/