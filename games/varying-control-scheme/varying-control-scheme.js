var varyingControlTask = _.extend({}, baseTask, attractiveController, repulsiveController, globalController, {
    taskName: "varying_control",
    taskMode: "default",    

    _numrobots: 16,                                          // number of robots
    _robots: [],                                            // array of bodies representing the robots
    _blocks: [],                                            // array of bodies representing blocks
    _goals: [],                                             // array of goals of form {x,y,w,h}
    _impulse: 50,                                            // impulse to move robots by
    _impulseV: new phys.vec2(0,0),                          // global impulse to control all robots
    _world: new phys.world( new phys.vec2(0, 0), true ),   // physics world to contain sim
    _zeroReferencePoint: new phys.vec2(0,0),                // cached reference point for impulse application    
    _mX: 0,
    _mY: 0,
    _attracting: false,
    _repulsing: false,
    _taskModes: new Array("attractive", "repulsive", "global"),

    setupInstructions: function ( options ){
        var that = this;
        this.instructions = "Try different ways of controlling robots. Press mouse button to engage robots (blue) to move blocks (green) toward goal positions (outlined).";
        if( that.mobileUserAgent ){
            this.instructions = "Try different ways of controlling robots. Touch screen to engage robots (blue) to move blocks (green) toward goal positions (outlined)."
        }
        this.instructions += " Play all "+this._taskModes.length+"!"+"<div class='btn-group'>";
        _.each(that._taskModes, function (m) {
            that.instructions += "<button class='btn btn-default mode-button' title='choose control mode' id='button-"+m+"'>"+m+"</button>" ;
        });
        that.instructions += "</div>";
        $("#task-instructions").empty();
        $("#task-instructions").append( $( "<h4>How to play</h4><p>" + this.instructions + "<p>") );
        //set the inital mode
        $("#button-"+that.taskMode).addClass("btn-success");
        _.each(that._taskModes, function (m) {
            $('#button-'+m).click(function() {
                that.taskMode = m;
                $(".mode-button").removeClass("btn-success");
                $("#button-"+m).addClass("btn-success");
            });
        });                
    },

    setupTask: function( options ) { 
        this.taskMode = this._taskModes[ Math.floor(Math.random()*this._taskModes.length) ];
        switch (this.taskMode) {
            case "attractive": this.update = this.attractiveUpdate; break;
            case "repulsive": this.update = this.repulsiveUpdate; break;
            case "global": this.update = this.globalUpdate; break;
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

        // create short middle wall
        fixDef.shape.SetAsBox( 4, this.obsThick);
        bodyDef.position.Set(10, 10);
        this._world.CreateBody(bodyDef).CreateFixture(fixDef);

        // create pyramid blocks
        this._blocks = [];
        bodyDef.type = phys.body.b2_dynamicBody;
        bodyDef.userData = 'workpiece';
        fixDef.shape = new phys.polyShape();
        fixDef.shape.SetAsBox( .5,.5);
        fixDef.density = 5.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;  //bouncing value
        for(var i = 0; i < 6; ++i) {
            bodyDef.position.x = 4.5 + 2*i;
            bodyDef.position.y = 15;
            this._blocks[i] = this._world.CreateBody(bodyDef);
            this._blocks[i].CreateFixture(fixDef);
            this._blocks[i].m_angularDamping = 5;
            this._blocks[i].m_linearDamping = 5;
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
        for(var i = 0; i < this._numrobots; ++i) {
            bodyDef.position.x = (i%4)*1.2 + xoffset;
            bodyDef.position.y = 1.2*Math.floor( i/4 ) + yoffset;
            this._robots[i] = this._world.CreateBody(bodyDef);
            this._robots[i].CreateFixture(fixDef);
            this._robots[i].m_angularDamping = 10;
            this._robots[i].m_linearDamping = 10;
        }

        // create goals
        var goalPositions = [ {x:10, y:8.2}, 
                              {x:9.5, y:9.2}, {x:10.5,y:9.2}
                              ];
                              fixDef.isSensor = true;
                              fixDef.shape = new phys.polyShape;
                              fixDef.shape.SetAsBox(.2,.2);
                              bodyDef.type = phys.body.b2_dynamicBody;
                              bodyDef.userData = "goal";
                              var that = this;
                              _.each(goalPositions, function (gp) {
                                var body;
                                bodyDef.position.Set(gp.x,gp.y);
                                body = that._world.CreateBody(bodyDef);
                                body.CreateFixture(fixDef);
                                that._goals.push(body);
                            });
                          },

                          setupController: function ( options ) {
                            var that = this;
                            switch( that.taskMode ) {
                                case "attractive": that.setupAttractiveController(options); break;
                                case "repulsive" : that.setupRepulsiveController(options);break;
                                case "global" : that.setupGlobalController(options);break;
                            }
                        },

                        evaluateCompletion: function( options ) {
                            var ret = true;
        // need to check if object has been moved into the goal zone
        var that = this;
        var blockupied = 0;
        // for each goal, see if it contains a block
        _.each(that._blocks, function (b) {
            var blockAABB = b.GetFixtureList().GetAABB();
            _.every(that._goals, function (g) {
                ret = blockAABB.Contains( g.GetFixtureList().GetAABB() );
                if (ret) {
                    blockupied++;
                }
                return !ret;
            });
        });

        return blockupied == this._goals.length;
    },

    draw: function() {
        drawutils.clearCanvas();
        var that = this;

        //initialize robots to not be at goal
        _.each( that._blocks, function(b) {
            b.atGoal = false;
        });


        // draw goal zone
        _.each(that._goals, function (g) { 
            var f = g.GetFixtureList();
            var verts = f.GetShape().GetVertices();
            var X = verts[1].x - verts[0].x; 
            var Y = verts[2].y - verts[1].y;
            var pos = g.GetPosition();
            drawutils.drawEmptyRect(30*pos.x, 30*pos.y, 30* X*2.2, 30 * Y*2.2, that.colorGoal,0,that.strokeWidth);
            _.each(that._blocks, function (b) {
                var blockAABB = b.GetFixtureList().GetAABB();
                ret = blockAABB.Contains( g.GetFixtureList().GetAABB() );
                if (ret) {
                    b.atGoal = true;
                }
            });  
        });


        if(that._startTime == null){
            switch (that.taskMode) {
                case "attractive": that.update = that.attractiveUpdate; break;
                case "repulsive": that.update = that.repulsiveUpdate; break;
                case "global": that.update = that.globalUpdate; break;
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
                    if (that.taskMode == 'attractive' || that.taskMode == 'repulsive')
                    {drawutils.drawLine([[30*(-0.2+pos.x), 30*pos.y],[30*(0.2+pos.x), 30*pos.y]],'darkblue',true,that.strokeWidthThick); // minus
            }
            if (that.taskMode == 'repulsive' )
                    {drawutils.drawLine([[30*(pos.x), 30*(-0.2+pos.y)],[30*(pos.x), 30*(0.2+pos.y)]],'darkblue',true,that.strokeWidthThick); //vertical
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
                } else {
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
        
        if( that.taskMode == "global")
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
          drawutils.drawLine(pts,"rgba(0, 0, 153, 0.5)",true,18,false);
      }else{
            // draw controller position.  James asked for this, but the lag behind the cursor position is very noticeable, so I commented it out.
            drawutils.drawLine([[30*(-0.2+this._mX), 30*this._mY],[30*(0.2+this._mX), 30*this._mY]],'darkblue',true); // minus
            drawutils.drawLine([[30*(this._mX), 30*(-0.2+this._mY)],[30*(this._mX), 30*(0.2+this._mY)]],'darkblue',true); //vertical
        }

        // draw text before game starts
        if(that._startTime == null){
            var color = 'white';
            var meanx = 0;
            var miny =  Number.MAX_VALUE;
            var maxx =  Number.MIN_VALUE;
            var meany = 0;
            // draw goal zone
            _.each(that._goals, function (g) { 
                var pos = g.GetPosition();
                if( pos.x >maxx)
                    {maxx = pos.x;}
                meanx = meanx + pos.x/that._goals.length;
                meany = meany + pos.y/that._goals.length;      
            });
            color = that.colorGoal;
            drawutils.drawText(30*(maxx+2),30*meany,"←Goals", 1.5, color, color);


            var meanx = 0;
            var miny =  Number.MAX_VALUE;
            var maxx =  Number.MIN_VALUE;
            var meany = 0;
            _.each(that._blocks, function (g) { 
                var pos = g.GetPosition();
                if( pos.y < miny)
                    {miny = pos.y;} 
                meanx = meanx + pos.x/that._blocks.length;
                meany = meany + pos.y/that._blocks.length;   
            });
            color = that.colorObject;
            drawutils.drawText(30*(meanx),30*(miny-1),"Blocks", 1.5, color, color)

            if(that.mobileUserAgent)
                {drawutils.drawText(300,525,"Move Blocks to Goals with touchscreen", 1.5, color, color);}
            else{drawutils.drawText(300,525,"Move Blocks to Goals using your mouse", 1.5, color, color);}
            var strInstruction = "";
            var strControlMode = "mouse click";
            if(that.mobileUserAgent)
                {strControlMode = "your touch";}
            switch( that.taskMode ) {
                case "attractive": strInstruction ="Robots are attracted to "+strControlMode; break;
                case "repulsive" : strInstruction ="Robots are repulsed from "+strControlMode;break;
                case "global" : strInstruction ="Robots move in direction of "+strControlMode;break;
            }
            drawutils.drawText(300,80,strInstruction, 1.5, color, color)
            drawutils.drawText(300,50,that.taskMode+" control:", 1.5, 'black', 'black')

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
            drawutils.drawText(30*(minx-2.3),30*(meany-.55),"Robots→", 1.5, color, color);
        }

    },

    // update function run every frame to update our robots    
    update: function() {
        var that = this;
        // apply the user force to all the robots
        if (that._attracting) {
            _.each( that._robots, function(r) { 
                var rpos = r.GetPosition();             
                var dx = that._mX - rpos.x;
                var dy = that._mY - rpos.y;
                var mag = Math.sqrt(dx*dx + dy*dy);

                that._impulseV.x = 10*dx/mag || 0;
                that._impulseV.y = 10*dy/mag || 0;
                r.ApplyForce( that._impulseV, r.GetWorldPoint( that._zeroReferencePoint ) );
            } );
        }

        // step the world, and then remove all pending forces
        this._world.Step(1 / 60, 10, 10);
        this._world.ClearForces();
    },
});

// this makes sure that the "this" context is properly set
for (var m in varyingControlTask) {
    if (typeof varyingControlTask[m] == "function") {
        varyingControlTask[m] = _.bind( varyingControlTask[m], varyingControlTask );
    }
}

// register our task with the application
app.registerTask( varyingControlTask );
