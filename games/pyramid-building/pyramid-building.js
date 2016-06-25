var pyramidBuildingTask = _.extend({}, baseTask, baseController, {
    taskName: "pyramid_building",
    taskMode: 0,    

    _numrobots: 8,                                          // number of robots
    _robots: [],                                            // array of bodies representing the robots
    _blocks: [],                                            // array of bodies representing blocks
    _goals: [],                                             // array of goals of form {x,y,w,h}
    _impulse: 50,                                            // impulse to move robots by
    _impulseV: new phys.vec2(0,0),                          // global impulse to control all robots
    _world: new phys.world( new phys.vec2(0, 00), true ),   // physics world to contain sim
    _zeroReferencePoint: new phys.vec2(0,0),                // cached reference point for impulse application    

    setupTask: function( options ) {
        this.taskMode = (10*Math.random()).toFixed(1);  //add some noise: 0.0 to 10.0
        this.instructions = "Use the robots (blue) to move the blocks (green) to the goal positions (outlined) with the arrow keys (&#8592;,&#8593;,&#8595;,&#8594;).";
        if(this.mobileUserAgent){
            this.instructions = "Use the robots (blue) to move the blocks (green) to the goal positions (outlined) by tilting screen (&#8592;,&#8593;,&#8595;,&#8594;).";
        }

        this.instructions += '<p> Be careful! <a href="http://en.wikipedia.org/wiki/Brownian_noise">Brownian noise</a> ' + this.taskMode*20 + '% of control power is pushing your robots.';
        // better: take number * 200% of control power
        //atto meters:  1 nanocar wheel weighs 720 g/mol = 7.2*10^-23 g, assume nanocar is 6 times that = 4.2*10&-22
        // dragster moves 0.014 mm/hr
        // fixture definition for obstacles
        //http://arxiv.org/pdf/cond-mat/0506038.pdf
        //http://research.chem.ucr.edu/groups/bartels/publications/prl79p697.pdf  (talks about pushing & pulling)
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
            this._blocks[i].atGoal = false;
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
        var goalPositions = [ {x:10.0, y:7.2},
        {x:9.5, y:8.2}, {x:10.5, y:8.2},
        {x:9, y:9.2}, {x:10.0,y:9.2}, {x:11,y:9.2}];
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
        /* setup key listeners */
        document.addEventListener( "keydown", function(e){
            that.lastUserInteraction = new Date().getTime();
            switch (e.keyCode) {
                case 37 : that._impulseV.x = -that._impulse; break;
                case 39 : that._impulseV.x = that._impulse; break;
                case 38 : that._impulseV.y = -that._impulse; break;
                case 40 : that._impulseV.y = that._impulse; break;
                case 65 : that._impulseV.x = -that._impulse; break;
                case 68 : that._impulseV.x = that._impulse; break;
                case 87 : that._impulseV.y = -that._impulse; break;
                case 83 : that._impulseV.y = that._impulse; break;
            }
        //check if this is the first keypress -- TODO:  this should be shared code.
        if( that.firstKeyPressed == false && Math.abs(that._impulseV.x) + Math.abs(that._impulseV.y) > 0)
        { 
            that.firstKeyPressed  = true;
            that._startTime = new Date();
            that._runtime = 0.0;
        }
    } , false );

document.addEventListener( "keyup", function(e){
    that.lastUserInteraction = new Date().getTime();
    switch (e.keyCode) {
        case 37 : that._impulseV.x = 0; break;
        case 39 : that._impulseV.x = 0; break;
        case 38 : that._impulseV.y = 0; break;
        case 40 : that._impulseV.y = 0; break;
        case 65 : that._impulseV.x = 0; break;
        case 68 : that._impulseV.x = 0; break;
        case 87 : that._impulseV.y = 0; break;
        case 83 : that._impulseV.y = 0; break;
    }} , false );
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
                } else if (b.GetUserData() == 'workpiece') {
                    // draw the objects
                    var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    var pos = b.GetPosition();
                    var color = that.colorObject;
                    if (b.atGoal == true)
                        {color = that.colorObjectAtGoal;}
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color,angle,that.colorObjectEdge,0,that.strokeWidth);
                } else {
                    // draw the obstacles
                    var X = f.GetShape().GetVertices()[1].x - f.GetShape().GetVertices()[0].x; 
                    var Y = f.GetShape().GetVertices()[2].y - f.GetShape().GetVertices()[1].y;
                    var pos = b.GetPosition();
                    var color = that.colorObject;
                    if(b.GetUserData() == 'obstacle') {
                        color = that.colorObstacle;
                    }
                    drawutils.drawRect(30*pos.x, 30*pos.y, 30* X, 30 * Y, color);


                }
            }
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


            var meanx = 0;
            var miny =  Number.MAX_VALUE;
            var meany = 0;
            for(var i = 0; i < this._numrobots; ++i) {
                var pos = this._robots[i].GetPosition();
                meanx = meanx + pos.x/this._numrobots;
                meany = meany + pos.y/this._numrobots;
                if( pos.y < miny)
                    {miny = pos.y;}
            }
            color = that.colorRobot;
            drawutils.drawText(30*(meanx),30*(miny-1),"Robots", 1.5, color, color);

            color = that.colorObstacle;
            drawutils.drawText(300,500,"Move Blocks to Goals", 1.5, color, color);
            if(this.mobileUserAgent){
                  drawutils.drawText(300,530,"by tilting screen (←,↑,↓,→)", 1.5, color, color);
            }else{drawutils.drawText(300,530,"with arrow keys (←,↑,↓,→)", 1.5, color, color);}
        }

    },

    // update function run every frame to update our robots
    update: function() {
        var that = this;

        // moving at diagonal is no faster than moving sideways or up/down
        var normalizer = Math.min(1,that._impulse/Math.sqrt(that._impulseV.x*that._impulseV.x + that._impulseV.y*that._impulseV.y));
        that._impulseV.x *=  normalizer;    
        that._impulseV.y *=  normalizer; 
        // apply the user force to all the robots
        var brownianImpulse = new phys.vec2(0,0); 
        var mag = 0;
        var ang = 0;
        _.each( that._robots, function(r) { 
            //apply Brownian noise:  0-100, maximum force we can apply is 50, so take #*200%
            mag = that.taskMode*10*Math.random();
            ang = 2*Math.PI*Math.random();
            brownianImpulse.x = mag*Math.cos(ang) + that._impulseV.x ;
            brownianImpulse.y = mag*Math.sin(ang) + that._impulseV.y ;
            r.ApplyForce( brownianImpulse, r.GetWorldPoint( that._zeroReferencePoint ) );
        } );
        // step the world, and then remove all pending forces
        this._world.Step(1 / 60, 10, 10);
        this._world.ClearForces();
    },

});

// this makes sure that the "this" context is properly set
for (var m in pyramidBuildingTask) {
    if (typeof pyramidBuildingTask[m] == "function") {
        pyramidBuildingTask[m] = _.bind( pyramidBuildingTask[m], pyramidBuildingTask );
    }
}

// register our task with the application
app.registerTask( pyramidBuildingTask );
