
var imgCash = {}

function getJson(filename) {
	return new Promise((resolve, reject) => {
		$.getJSON(filename, data => resolve(data))
	})
}
function createMenuImgUrl(json) {
	let keys = Object.keys(json)
	let style = ''
	keys.forEach((key, i) => {
		let num = ('00' + (i+1)).slice(-2)
		style += `.img[num="${num}"]::before { background-image: url(./sprite/${key}); }\r\n`
	})
	$(document.head).append(`<style id="menu-url">${style}</style>`)
}
function createMenuDom(json) {
	let keys = Object.keys(json)
	let dom = ''
	keys.forEach((key, i) => {
		let num = ('00' + (i+1)).slice(-2)
		let name = key.match(/(.+)\./)[1]
		dom += `<li class="button"><a class="img" num="${num}">${name}</a></li>`
	})
	$('#menu ul').append(dom)
}
function createTexture(name, scale) {
	return new Promise((resolve, reject) => {
		
		let img = imgCash[name+'-'+scale]
		if (img) {
			resolve(img);
		} else {
			let canvas = document.createElement('canvas')
			canvas.width = 16*scale
			canvas.height = 16*scale
			let ctx = canvas.getContext('2d')
			ctx.imageSmoothingEnabled = false;
			let chara = new Image();
			chara.src = 'sprite/' + name;
			chara.onload = () => {
				ctx.drawImage(chara, 0, 0, 16*scale, 16*scale);
				imgCash[name+'-'+scale] = canvas;
				resolve(canvas);
			}
		}
	})
}

// メイン処理
(async function() {
	
	// json取得
	let json = await getJson('contours.json');
	let keys = Object.keys(json)
	
	// メニューの画像用スタイル作成
	createMenuImgUrl(json);
	// メニューdom作成
	createMenuDom(json);
	// メニュー生成
	var menu = new MmenuLight($('#menu')[0]);
	var navigator = menu.navigation({title: ''});
	var drawer = menu.offcanvas();
	$('a[href="#menu"]').on('click', e => {
		e.preventDefault();
		drawer.open();
	});
	
	// 数字入力dom生成
	let p = $('<div class="ctl p">+</div>')
	let m = $('<div class="ctl m">－</div>')
	$('#size').after(m).after(p);
	$('.ctl').on('click', e => {
		let i = $(e.target).parent().find('input')[0]
		i.value = i.value*1 + ($(e.target).hasClass('p') ? 1 : -1);
	})
	
	
	
	// 物理エンジン開始
	const WORLD_WIDTH = document.documentElement.clientWidth;
	const WORLD_HEIGHT = document.documentElement.clientHeight - $('.header').height();
	let engine = new MatterEngine(WORLD_WIDTH, WORLD_HEIGHT);
	
	let addNum = async (num) => {
		let name = keys[num]
		let scale = $('#size').val()
		let img = await createTexture(name, scale)
		engine.addVoiceroid(img, json[name], WORLD_WIDTH/2, WORLD_HEIGHT/10*2, scale)
	}
	$('#rm-all').on('click', e =>{
		engine.clearAll();
	})
	$('#rm-rnd').on('click', e => {
		engine.clearRnd();
	})
	$('#rm-lastadd').on('click', e => {
		engine.clear(engine.lastAdded);
	})
	$('#rm-lasttouch').on('click', e => {
		engine.clear(engine.lastTouches);
	})
	$('#ad-all').on('click', async (e) => {
		let array = [...keys]
		for(var i = array.length - 1; i > 0; i--){
			var r = Math.floor(Math.random() * (i + 1));
			var tmp = array[i];
			array[i] = array[r];
			array[r] = tmp;
		}
		let scale = $('#size').val()
		for (let key of array) {
			let img = await createTexture(key, scale)
			engine.addVoiceroid(img, json[key], WORLD_WIDTH/2, WORLD_HEIGHT/10*2, scale)
		}
	})
	$('#ad-rnd').on('click', e => {
		let num = Math.floor(Math.random() * keys.length);
		addNum(num, 5)
	})
	$('.img').on('click', e => {
		let num = Number($(e.target).attr('num')) - 1;
		addNum(num)
	})
	
	
	$('.ctr:before').on('click', e => {
		console.log('');
	})
	
	// pow
	$('#pow').on('click', e => {
		engine.explosion()
	})
	
	$('#frame').on('click', e => engine.toggleWireframes())
	const DEBUG = false;
	if (DEBUG) {
		$('#prop').show();
		$('#frame').on('click', e => engine.toggleWireframes())
		$('.Offset').on('change', e => {
			engine.lastAdded.render.sprite[e.target.id + 'Offset'] = e.target.value / 100
		})
		$('#num').on('change', e =>  {
			addNum(e.target.value)
			let obj = engine.lastAdded
			$('#x.Offset').val(Math.floor(obj.render.sprite.xOffset * 100))
			$('#y.Offset').val(Math.floor(obj.render.sprite.yOffset * 100))
		})
		$('#copy').on('click', e => {
			// オフセット情報をクリップボードにコピー
			let x = $('#x.Offset').val();
			let y = $('#y.Offset').val();
			e.target.value = `"xOffset":${x},"yOffset":${y},`;
			e.target.select();
			document.execCommand("copy");
		})
	}
	
})();


