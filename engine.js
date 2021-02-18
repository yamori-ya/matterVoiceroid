class MatterEngine {
	constructor(WIDTH, HEIGHT) {
		var engine = this.engine = Matter.Engine.create(document.body, {
			render: {
				options: {
					width: WIDTH,
					height: HEIGHT,
					pixelRatio: 1,
					background: '#fafafa',
					wireframeBackground: '#222',
					hasBounds: true,
					enabled: true,
					wireframes: false,
					showSleeping: false,
					showDebug: false,
					showBroadphase: false,
					showBounds: false,
					showVelocity: false,
					showCollisions: false,
					showSeparations: false,
					showAxes: false,
					showPositions: false,
					showAngleIndicator: false,
					showIds: false,
					showShadows: false,
					showVertexNumbers: false,
					showConvexHulls: false,
					showInternalEdges: false
				}
			}
		});
		
		this._lastAdded = {};
		this._lastTouches = {};
		
		// ゆかり
		const WALL_W = 50;
		let walls = [
			Matter.Bodies.rectangle(    0-WALL_W/2, HEIGHT/2, WALL_W, HEIGHT, { isStatic: true }), // L
			Matter.Bodies.rectangle(WIDTH+WALL_W/2, HEIGHT/2, WALL_W, HEIGHT, { isStatic: true }), // R
			Matter.Bodies.rectangle(WIDTH/2,      0-WALL_W/2, WIDTH, WALL_W, { isStatic: true }), // U
			Matter.Bodies.rectangle(WIDTH/2, HEIGHT+WALL_W/2, WIDTH, WALL_W, { isStatic: true }), // D
		] 
		// クリック機能
		var mousedrag = Matter.MouseConstraint.create(engine, {
			element: document.body, 
			constraint: {
				render: {
					strokeStyle: "rgba(255, 255, 255, 255)" //マウスの動きを表示する(白)
				}
			}
		});
		// updateを上書き
		let $this = this;
		let _update = Matter.MouseConstraint.update
		Matter.MouseConstraint.update = function(mouseConstraint, bodies) {
			_update(mouseConstraint, bodies)
			if (mouseConstraint.body) {
				$this._lastTouches = mouseConstraint.body;
			}
		}
		
		Matter.World.add(engine.world, [ mousedrag, ...walls ]);
		
		// 物理シミュレーションを実行
		Matter.Engine.run(engine);
	}
	
	get lastAdded() {
		return this._lastAdded;
	}
	get lastTouches() {
		return this._lastTouches;
	}
	toggleWireframes() {
		this.engine.render.options.wireframes ^= true
	}
	
	addVoiceroid(name, obj) {
		let points = obj.points.map(i => {return {x:i.x, y:i.y}})
		let vertices = Matter.Vertices.create(points);
		
		let scale = 1;
		vertices = Matter.Vertices.scale(vertices, scale, scale)
		
		let body = Matter.Bodies.fromVertices(500, 200, vertices, {
			isStatic: false,
			render: {
				sprite: {
					texture: 'sprite/' + name,
					xScale: scale,
					yScale: scale
				}
			},
			timeScale: 1
		}, true);
		
		Matter.World.add(this.engine.world, body)
		if (obj.xOffset != 0) body.render.sprite.xOffset = (obj.xOffset / 100)
		if (obj.yOffset != 0) body.render.sprite.yOffset = (obj.yOffset / 100)
		this._lastAdded = body;
	}
	
	clear(body) {
		Matter.Composite.removeBody(this.engine.world, body);
	}
	clearRnd() {
		let dynamic = this.engine.world.bodies.filter(b => !b.isStatic);
		let r = Math.floor(Math.random() * (dynamic.length + 1));
		this.clear(dynamic[r]);
	}
	clearAll() {
		for (let i = this.engine.world.bodies.length; i > 0; i--) {
			let body = this.engine.world.bodies[i];
			if (body && !body.isStatic) {
				this.clear(body);
			}
		}
	}
	explosion() {
		var bodies = Matter.Composite.allBodies(this.engine.world);
		
		for (var i = 0; i < bodies.length; i++) {
			var body = bodies[i];
			if (!body.isStatic /*&& body.position.y >= 500*/) {
				var forceMagnitude = 0.05 * body.mass;
				Matter.Body.applyForce(body, body.position, {
					x: (forceMagnitude + Matter.Common.random() * forceMagnitude) * Matter.Common.choose([1, -1]), 
					y: -forceMagnitude + Matter.Common.random() * -forceMagnitude
				});
			}
		}
	};
	
}
