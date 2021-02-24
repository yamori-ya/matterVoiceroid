class MatterEngine {
	constructor(WIDTH, HEIGHT) {
		var engine = this.engine = Matter.Engine.create($('.content')[0], {
			render: {
				options: {
					width: WIDTH,
					height: HEIGHT,
					pixelRatio: 1,
					background: '#fafafa',
					wireframeBackground: '#222',
					hasBounds: true,
					enabled: true,
					wireframes: false
				}
			}
		});
		
		this.onTouchObject = [];
		
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
			element: $('.content')[0],
			constraint: {
				render: {
					strokeStyle: "rgba(255, 50, 50, 255)" //マウスの動きを表示する(白)
				}
			}
		});
		
		let $this = this;
		Matter.Events.on(mousedrag, "mousedown", (e) => {
			if (e.source.body) {
				for (let callback of $this.onTouchObject) {
					callback(e.source.body)
				}
			}
		})
		Matter.World.add(engine.world, [ mousedrag, ...walls ]);
		
		// 物理シミュレーションを実行
		Matter.Engine.run(engine);
	}
	
	on(eventName, callback) {
		if (!eventName || !callback || typeof callback !== 'function') 
			return;
		switch(eventName) {
		case 'touchobject':
			this.onTouchObject.push(callback);
			break;
		}
	}
	off(eventName, callback) {
		if (!eventName) 
			return
		switch(eventName) {
		case 'touchobject':
			this.onTouchObject = (callback && typeof callback === 'function')
				? this.onTouchObject.filter(c => c != callback) // 対象のみ削除
				: [] // 全削除
			break;
		}
	}
	
	
	
	get lastTouches() {
		return this._lastTouches;
	}
	
	set wireframes(val) {
		this.engine.render.options.wireframes = val
	}
	
	addVoiceroid(img, obj, x, y, scale = 1) {
		let points = obj.points.map(i => {return {x:i.x, y:i.y}})
		let vertices = Matter.Vertices.create(points);
		vertices = Matter.Vertices.scale(vertices, scale/6, scale/6) // 6倍のテクスチャから輪郭を作成したいるため
		
		let body = Matter.Bodies.fromVertices(x, y, vertices, {
			isStatic: false,
			render: {
				sprite: { texture: img }
			},
			friction: 0.1,      // 摩擦係数 def:0.1
			frictionAir: 0.01 , // 空気抵抗 def:0.01
			restitution: 0,     // 反発係数 def:0
			timeScale: 1
		}, true);
		
		Matter.World.add(this.engine.world, body)
		// Matter.Body.setMass(body, body.mass * scale)
		if (obj.xOffset != 0) body.render.sprite.xOffset = (obj.xOffset / 100)
		if (obj.yOffset != 0) body.render.sprite.yOffset = (obj.yOffset / 100)
	}
	
	clear(body) {
		Matter.Composite.removeBody(this.engine.world, body);
	}
	clearRnd() {
		let dynamic = this.engine.world.bodies.filter(b => !b.isStatic);
		let r = Math.floor(Math.random() * (dynamic.length));
		this.clear(dynamic[r]);
	}
	clearAll() {
		let dynamic = this.engine.world.bodies.filter(b => !b.isStatic);
		dynamic.forEach(b => this.clear(b))
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
	}
	set gravity(g) {
		let gravity = this.engine.world.gravity
		if ('x' in g) gravity.x = g.x
		if ('y' in g) gravity.y = g.y
		if ('scale' in g) gravity.scale = g.scale / 10000
	}
	set friction(g) {
		for (let body of this.engine.world.bodies) {
			body.friction = g / 10
		}
	}
	set frictionAir(g) {
		for (let body of this.engine.world.bodies) {
			body.frictionAir = g / 100
		}
	}
	set restitution(g) {
		for (let body of this.engine.world.bodies) {
			body.restitution = g / 10
		}
	}
}
