var phys = {
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
        for ( i = 0; i < Mpoints.length; i++) {
            points.push( new phys.vec2(2*Mpoints[i].x, 2*Mpoints[i].y) );
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

    makeBlock: function(world, x, y, w, h, userData){
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
