var varyingControlTask = _.extend({}, baseTask, attractiveController, repulsiveController, globalController, {
    taskName: 'forage',
    taskMode: 'default',
    
    _numrobots: 100,                                        // number of robots
    _robotRadius: 0.5,
    _robots: [],                                            // array of bodies representing the robots
    _blocks: [],                                            // array of bodies representing blocks
    _goals: [],                                             // array of goals of form {x,y,w,h}
    _impulse: 50,                                           // impulse to move robots by
    _impulseV: new phys.vec2(0,0),                          // global impulse to control all robots
    _world: new phys.world( new phys.vec2(0, 0), true ),    // physics world to contain sim
    _zeroReferencePoint: new phys.vec2(0,0),                // cached reference point for impulse application    
    _mX: 0,
    _mY: 0,
    _attracting: false,
    _repulsing: false,
    _taskModes: ['attractive', 'repulsive', 'global'],
    _numblocksCollected: 0,
    _numblocksTotal: 50,

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
            var color = 'white';
           
            var i = 0;
            var c = 0;
            while( i < 5) {
                var pos = that._blocks[c++].GetPosition();
                if( pos.x < 16 && pos.y < 13 && pos.y > 5){
                    color = that.colorObjectEdge; 
                    drawutils.drawRect(30*(pos.x+1.7),30*pos.y, 80,22, 'rgba(240, 240, 240, 0.4)',0,'rgba(240, 240, 240, 0.4)',0);
                    drawutils.drawText(30*(pos.x+1.7),30*pos.y,'←Food', 1.5, color, color);
                    i++;
                }
            };
            
            color = that.colorObject;
            drawutils.drawRect(300,560, 470,30, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',0);
            if(that.mobileUserAgent){
                drawutils.drawText(300,560, 'use touchscreen to bring 90% of food home', 1.5, color, color);
            }else{drawutils.drawText(300,560, 'use your mouse to bring 90% of food home', 1.5, color, color);}

            var strInstruction = '';
            var strControlMode = 'mouse click';
            if(that.mobileUserAgent)
                {strControlMode = 'your touch';}
            switch( that.taskMode ) {
                case 'attractive': strInstruction ='Robots are attracted to '+strControlMode; break;
                case 'repulsive' : strInstruction ='Robots are repulsed from '+strControlMode;break;
                case 'global' : strInstruction ='Robots move in direction of '+strControlMode;break;
            }
            drawutils.drawRect(300,65, 420,60, 'rgba(240, 240, 240, 0.7)',0,'rgba(240, 240, 240, 0.7)',0);
            drawutils.drawText(300,80,strInstruction, 1.5, color, color)
            drawutils.drawText(300,50,that.taskMode+' control:', 1.5, 'black', 'black')

            var meanx = 0;
            var miny =  Number.MAX_VALUE;
            var minx =  Number.MAX_VALUE;
            var meany = 0;
            for(var i = 0; i < this._numrobots; ++i) {
                var pos = this._robots[i].GetPosition();
                meanx = meanx + pos.x/this._numrobots;
                meany = meany + pos.y/this._numrobots;
                if( pos.y < miny)
                    {miny = pos.y;}
                if( pos.x < minx)
                    {minx = pos.x;}
            }
            color = that.colorRobot;
            drawutils.drawText(30*(minx-2.3),30*(meany- 0.55),'Robots→', 1.5, color, color);
        }
    }
});

// this makes sure that the "this" context is properly set
for (var m in varyingControlTask) {
    if (typeof varyingControlTask[m] == 'function') {
        varyingControlTask[m] = _.bind( varyingControlTask[m], varyingControlTask );
    }
}

// register our task with the application
app.registerTask( varyingControlTask );
