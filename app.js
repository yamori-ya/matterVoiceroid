var gyroOk = false;

function getJson(filename) {
	return new Promise((resolve, reject) => {
		$.getJSON(filename, data => resolve(data))
	})
}

var imgCash = {}
function create16Image(json) {
	return new Promise((resolve, reject) => {
		let keys = Object.keys(json)
		let allImage = new Image()
		allImage.onload = () => {
			for (let i = 0; i < 27; i++) {
				let row = Math.floor(i / 9)
				let col = i % 9
				
				let ctx, canvas = document.createElement('canvas')
				canvas.width = 16
				canvas.height = 16
				ctx = canvas.getContext('2d')
				ctx.drawImage(allImage,
					col*16, row*16, 16, 16,
					0, 0, 16, 16)
				imgCash[keys[i]+'-1'] = canvas
			}
			resolve()
		}
		allImage.src = './all.png'
	})
}
function createMenuBgStyle() {
	let style = Object.keys(imgCash).map((key, i) => {
		let num = ('00' + (i+1)).slice(-2)
		return `.img[num="${num}"]>div>div::before { background-image: url(${imgCash[key].toDataURL()}); }`
	}).join('\r\n')
	$(document.head).append(`<style id="menu-url">${style}</style>`)
}
function createMenuDom(json) {
	let dom = Object.keys(json).map((key, i) => {
		let num = ('00' + (i+1)).slice(-2)
		let name = key.match(/(.+)\./)[1]
		return `<li class="button img" num="${num}">${name}</li>`
	}).join('')
	$('#menu > ul').append(dom)
}
function createTexture(name, scale) {
	let img = imgCash[name+'-'+scale]
	if (img) {
		return img;
	} else {
		let ctx, canvas = document.createElement('canvas')
		canvas.width = 16*scale
		canvas.height = 16*scale
		ctx = canvas.getContext('2d')
		ctx.imageSmoothingEnabled = false
		ctx.drawImage(imgCash[name+'-1'],
			0, 0, 16*scale, 16*scale)
		imgCash[name+'-'+scale] = canvas
		return canvas
	}
}


// メイン処理
(async function() {
	// json取得
	let json = await getJson('contours.json')
	let keys = Object.keys(json)
	
	// 全キャラ16*16のイメージcanvas作成
	await create16Image(json)
	// メニューの画像用スタイル作成
	createMenuBgStyle()
	// メニューdom作成
	createMenuDom(json)
	
	
	// メニュー生成
	let ymenu = new Ymenu('#menu')
	let menuItem = ymenu.item
	$('a[href="#menu"]').on('click', e => {
		e.preventDefault()
		ymenu.open()
	});
	
	
	
	// 物理エンジン開始
	const WORLD_WIDTH = document.documentElement.clientWidth;
	const WORLD_HEIGHT = document.documentElement.clientHeight - $('.header').height();
	let engine = new MatterEngine(WORLD_WIDTH, WORLD_HEIGHT);
	engine.on('touchobject', body => {
		if (menuItem['rm-touch'].checked) engine.clear(body)
	})
	
	let addNum = (num) => {
		let name = keys[num]
		let scale = menuItem['size'].value
		let img = createTexture(name, scale)
		engine.addVoiceroid(img, json[name], WORLD_WIDTH/2, WORLD_HEIGHT/10*2, scale)
	}
	$(menuItem['rm-all']).on('click', e => {
		engine.clearAll();
	})
	$(menuItem['rm-rnd']).on('click', e => {
		engine.clearRnd();
	})
	$(menuItem['ad-all']).on('click', e => {
		let array = [...keys]
		for(var i = array.length - 1; i > 0; i--){
			var r = Math.floor(Math.random() * (i + 1));
			var tmp = array[i];
			array[i] = array[r];
			array[r] = tmp;
		}
		let scale = menuItem['size'].value
		for (let key of array) {
			let img = createTexture(key, scale)
			let g = key.startsWith('18') ? 2 : 1
			engine.addVoiceroid(img, json[key], WORLD_WIDTH/2, WORLD_HEIGHT/10*2, scale)
		}
	})
	$(menuItem['ad-rnd']).on('click', e => {
		let num = Math.floor(Math.random() * keys.length);
		addNum(num)
	})
	$('.img>div').on('click', e => {
		let num = Number($(e.currentTarget).parent().attr('num')) - 1;
		addNum(num)
	})
	
	
	
	$(menuItem['frame']).on('change', e => {
		engine.wireframes = e.target.checked
	})
	$(menuItem['air']).on('change input', e => {
		engine.frictionAir = e.target.value
	})
	$(menuItem['fic']).on('change input', e => {
		engine.friction = e.target.value
	})
	$(menuItem['res']).on('change input', e => {
		engine.restitution = e.target.value
	})
	$(menuItem['gravity']).on('change input', e => {
		engine.gravity = { scale: e.target.value }
	})
	$(menuItem['gyro']).on('change', e => {
		if (!e.target.checked) {
			engine.gravity = { x: 0, y: 1 }
		}
	})
	
	$('#gyro').on('click', e => {
		let gyro = function() {
			if (menuItem['gyro'].checked) {
				let gamma, beta, big, sml, x, y
				beta  = Math.floor(event.beta)
				gamma = Math.floor(event.gamma)
				// $('div', menuItem['j-alpha']).text('水平:' + event.alpha);
				// $('div', menuItem['j-beta']).text('縦:' + event.beta);
				// $('div', menuItem['j-gamma']).text('横:' + event.gamma);
				
				if (beta == 0 && gamma == 0) {
					x = 0
					y = 0
				} else if (Math.abs(beta) > Math.abs(gamma)) {
					x = gamma / Math.abs(beta)
					y = beta  / Math.abs(beta)
				} else {
					x = gamma / Math.abs(gamma)
					y = beta  / Math.abs(gamma)
				}
				engine.gravity = { x: x, y: y }
			}
		}
		if (!gyroOk) {
			// ジャイロセンサーが使用可能だったら
			if (window.DeviceOrientationEvent) {
				//	ユーザーにアクセスの許可を求める関数があったら（iOS13以降の対応）
				if (DeviceOrientationEvent.requestPermission) {
					$(".btn").on("click", function() {
						// ジャイロセンサーへのアクセス許可を申請する
						DeviceOrientationEvent.requestPermission().then(function(response) {
							// リクエストが許可されたら
							if (response === "granted") {
								gyroOk = true;
								$(window).on("deviceorientation", gyro);
							}
						});
					});
					// アクセスの許可を求める関数がなかったら
				} else {
					gyroOk = true;
					$(window).on("deviceorientation", gyro);
				}
			}
		}
	})
	
	
	
	
	// pow
	$('#pow').on('click', e => {
		engine.explosion()
	})
	
})();


