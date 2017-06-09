window.phys = (function(Box2D){
    'use strict';
    /*jshint camelcase:false */
    /* ^ we do this because the Box2D bindings are fugly. */

    return{
        vec2: Box2D.Common.Math.b2Vec2,
        AABB: Box2D.Collision.b2AABB,
        bodyDef: Box2D.Dynamics.b2BodyDef,
        body: Box2D.Dynamics.b2Body,
        fixtureDef: Box2D.Dynamics.b2FixtureDef,
        world: Box2D.Dynamics.b2World,
        massData: Box2D.Collision.Shapes.b2MassData,
        polyShape: Box2D.Collision.Shapes.b2PolygonShape,
        circleShape: Box2D.Collision.Shapes.b2CircleShape,
        mouseJointDef: Box2D.Dynamics.Joints.b2MouseJointDef,
        makeBox: function( world, x, y, xThickness, yThickness) {
                var phys = window.phys;
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
            },
        makeHexagon: function(world, x, y, userData) {
            // create block
            // This defines a hexagon in CCW order.
            // http://blog.sethladd.com/2011/09/box2d-and-polygons-for-javascript.html
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;

            var Mpoints = [     {x: 1, y: 0}, 
                                {x: 1/2, y: Math.sqrt(3)/2}, 
                                {x: -1/2, y:Math.sqrt(3)/2},
                                {x: -1, y:0}, 
                                {x: -1/2, y: -Math.sqrt(3)/2}, 
                                {x: 1/2, y:-Math.sqrt(3)/2} ];
            var points = [];
            for ( var i = 0; i < Mpoints.length; i++) {
                points.push( new phys.vec2(8*Mpoints[i].x, 8*Mpoints[i].y) );
            }
            fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
            fixDef.shape.SetAsArray(points, points.length);

            var body = world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);        
            body.m_angularDamping = 5;
            body.m_linearDamping = 5;
            return body;
        },

        makeRobot: function(world, x, y, radius, userData) {
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);
            

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.shape = new phys.circleShape( radius ); // radius .5 robots

            var body = world.CreateBody(bodyDef);
            body.m_angularDamping = 10;
            body.m_linearDamping = 10;
            body.CreateFixture(fixDef);        
            return body;
        },

        makePuzzle1: function(world,x,y,userData){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            var tolerance = 0.02;
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            var Mpoints1 = [        
                            {x: -3/4, y: Math.sqrt(3)/4},
                            {x: 0, y: Math.sqrt(3)/4},
                            {x: 0, y: Math.sqrt(3)/2},
                            {x: -1/2, y: Math.sqrt(3)/2}
                            ];
            var Mpoints2 = [ 
                            {x: -1/2 + tolerance, y: Math.sqrt(3)/4},
                            {x: -3/8 + tolerance, y: Math.sqrt(3)/4 - 1/4},
                            {x: -1/4 - tolerance, y: Math.sqrt(3)/4 - 1/4},
                            {x: -1/8 - tolerance, y: Math.sqrt(3)/4},
                            ];
                    
            var Mpoints = [Mpoints1, Mpoints2];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(4*Mpoints[j][i].x, 4*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },
        makePuzzle2: function(world,x,y,userData){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            var Mpoints1 = [ 
                            {x: 0, y: Math.sqrt(3)/4},      
                            {x: -1/8, y: Math.sqrt(3)/4},
                            {x: -1/4, y: Math.sqrt(3)/4 - 1/4},
                            {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/6},
                            {x: 0, y: -Math.sqrt(3)/12}
                            ];
            var Mpoints2 = [ 
                            {x: -1/2, y: -Math.sqrt(3)/2},
                            {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/2},
                            {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/6},
                            {x: -1/4, y: Math.sqrt(3)/4 - 1/4},
                            {x: -3/8, y: Math.sqrt(3)/4 - 1/4},
                            {x: -1, y: 0}
                            ];
            var Mpoints3 = [ 
                            {x: 0, y: -Math.sqrt(3)/2},
                            {x: 0, y: -Math.sqrt(3)*5/12},
                            {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/3},
                            {x: -1/2, y: -Math.sqrt(3)/2}
                            ];
            var Mpoints4 = [ 
                            {x: -3/4, y: Math.sqrt(3)/4},
                            {x: -1, y: 0},
                            {x: -3/8, y: Math.sqrt(3)/4 - 1/4},
                            {x: -1/2, y: Math.sqrt(3)/4}
                            ];
            
            var Mpoints = [Mpoints1, Mpoints2, Mpoints3, Mpoints4];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(4*Mpoints[j][i].x, 4*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },

        makePuzzle3: function(world,x,y,userData){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            var tolerance = 0.02;
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            var Mpoints1 = [        
                    {x: 0, y: -1/3},
                    {x: 0, y: -Math.sqrt(3)/2},
                    {x: 1/2, y: -Math.sqrt(3)/2},
                    {x: 2/3, y: -Math.sqrt(3)/3},
                    {x: 2/3, y: -1/3}
                    ];
            var Mpoints2 = [ 
                    {x: 0, y: -Math.sqrt(3)/12 - tolerance},
                    {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/6 - tolerance},
                    {x: -Math.sqrt(3)/6, y: -Math.sqrt(3)/3 + tolerance},
                    {x: 0, y: -Math.sqrt(3)*5/12 + tolerance}
                    ];
            var Mpoints3 = [ 
                    {x: 1, y: 0},
                    {x: 5/6, y: 0},
                    {x: 2/3, y: -1/3},
                    {x: 2/3, y: -Math.sqrt(3)/3},
                    ];
            var Mpoints4 = [
                    {x: 0, y: 0},
                    {x: 0, y: -1/3},
                    {x: 1/3, y: -1/3},
                    {x: 1/6, y: 0}
                    ];
            
            var Mpoints = [Mpoints1, Mpoints2, Mpoints3, Mpoints4];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(4*Mpoints[j][i].x, 4*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },
        makePuzzle4: function(world,x,y,userData){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            var tolerance = 0.02;
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            var Mpoints1 = [
                            {x: 0, y: 0}, 
                            {x: 1, y: 0},
                            {x: 1/2, y: Math.sqrt(3)/2}, 
                            {x: 0, y: Math.sqrt(3)/2}
                            ];
            var Mpoints2 = [ 
                            {x: 1/6 + tolerance, y: 0},
                            {x: 1/3 + tolerance, y: -1/3},
                            {x: 2/3 - tolerance, y: -1/3},
                            {x: 5/6 - tolerance, y: 0}
                            ];
            
            var Mpoints = [Mpoints1, Mpoints2];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(4*Mpoints[j][i].x, 4*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },

        makeMirroredBlock: function(world,x,y,userData,angle){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            var tolerance = 0.02;
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            
            var Mpoints1 = [ 
                            {x: 1/4, y: 1/2},           
                            //{x: 1/2, y: Math.sqrt(3)/2},
                            {x: -1/2, y: Math.sqrt(3)/2},
                            {x: -1, y: 0},
                            {x: 0, y: 0}
                            ];
            var Mpoints2 = [
                            {x: -tolerance, y: 0},
                            {x: -3/4 + tolerance, y: 0},
                            {x: -2/4 + tolerance, y: -1/2},
                            {x: -1/4 - tolerance, y: -1/2}
                            ];
            var Mpoints3 = [  
                            {x: 1/4, y: 1/2},
                            {x: 1/2, y: 1/2},
                            {x: 1/2, y: Math.sqrt(3)/2},
                            {x: -1/2, y: Math.sqrt(3)/2},
                            ];
            var Mpoints4 = [
                            {x: 1/2, y: Math.sqrt(3)/2},
                            {x: 1/2, y: 1/2},
                            {x: 3/4, y: 0},
                            {x: 1, y: 0}
                            ];

            var Mpoints = [Mpoints1, Mpoints2, Mpoints3, Mpoints4];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(2*Mpoints[j][i].x, 2*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                body.SetAngle(angle);
            }

            return body;
        },

        makeDishedBlock: function (world, x, y, userData) {
            // create block
            // This defines a hexagon in CCW order.
            // http://blog.sethladd.com/2011/09/box2d-and-polygons-for-javascript.html
            
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;

            var Mpoints1 = [ 
                            {x: -1/2, y: Math.sqrt(3)/4},
                            {x: 1/2 , y: Math.sqrt(3)/4},
                            {x: 1/2, y: Math.sqrt(3)/2},
                            {x: -1/2, y: Math.sqrt(3)/2}
                            ];
            var Mpoints2 = [ 
                            {x: 1, y: 0},
                            {x: 1/2, y: Math.sqrt(3)/2},
                            {x: 1/2, y: 0}
                            ];
            var Mpoints3 = [ 
                            {x: -1, y: 0},
                            {x: -1/2, y: 0},
                            {x: -1/2, y: Math.sqrt(3)/2}
                            ];

            var Mpoints = [Mpoints1, Mpoints2,Mpoints3];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(2*Mpoints[j][i].x, 2*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },

        makeBulgyBlock: function (world, x, y, userData) {
            // create block
            // This defines a hexagon in CCW order.
            // http://blog.sethladd.com/2011/09/box2d-and-polygons-for-javascript.html
            var tolerance = 0.05;
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);        

            var fixDef = new phys.fixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value
            fixDef.isSensor = false;
            var body = world.CreateBody(bodyDef);
            var i = 0;
            var Mpoints1 = [  
                            {x: 1, y:0}, 
                            {x: -1, y: 0},
                            {x: -1/2, y:-Math.sqrt(3)/2}, 
                            {x: 1/2, y: -Math.sqrt(3)/2}  ];
                                
            var Mpoints2 = [
            
                            {x: 1/2- tolerance, y: 0},
                            {x: 1/2-tolerance, y: Math.sqrt(3)/4}, 
                            {x: -1/2+tolerance, y: Math.sqrt(3)/4},
                            {x: -1/2+tolerance,y:0},
                            ];
        
            var Mpoints = [Mpoints1, Mpoints2];
            for (var j = 0 ; j< Mpoints.length; j++){
                var points = [];
                for ( i = 0; i < Mpoints[j].length; i++) {
                    points.push( new phys.vec2(2*Mpoints[j][i].x, 2*Mpoints[j][i].y) );
                }
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape.SetAsArray(points, points.length);
                body.CreateFixture(fixDef);        
                body.m_angularDamping = 5;
                body.m_linearDamping = 5;
                //body.SetAngle(1.5);
            }

            return body;
        },

        destroyRobot: function(world, bot) {
            for(var f = bot.GetFixtureList(); f; f = f.GetNext()) {
                bot.DestroyFixture(f);
            }
            world.DestroyBody(bot);
        },

        makeBlock: function(world, x, y, w, h, userData){
            var phys = window.phys;
            var bodyDef = new phys.bodyDef();
            bodyDef.type = phys.body.b2_dynamicBody;
            bodyDef.userData = userData;
            bodyDef.position.Set(x,y);

            var fixDef = new phys.fixtureDef();
            fixDef.shape = new phys.polyShape();
            fixDef.shape.SetAsBox( w, h);
            fixDef.density = 5.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;  //bouncing value

            var body = world.CreateBody(bodyDef);
            body.m_angularDamping = 5;
            body.m_linearDamping = 5;
            body.CreateFixture(fixDef);        
            return body;
        }
    };
})(window.Box2D);
