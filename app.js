
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
		style += `.drawer-menu-item.img[num="${num}"]::before { background-image: url(./sprite/${key}); }\r\n`
	})
	$(document.head).append(`<style id="menu-url">${style}</style>`)
}
function createMenuDom(json) {
	let keys = Object.keys(json)
	let dom = ''
	keys.forEach((key, i) => {
		let num = ('00' + (i+1)).slice(-2)
		let name = key.match(/(.+)\./)[1]
		dom += `<li><a class="drawer-menu-item img" num="${num}">${name}</a></li>`
	})
	$('#add-obj').append(dom)
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
	$(document).ready(() => $('.drawer').drawer());
	
	// 物理エンジン開始
	const WORLD_WIDTH = document.documentElement.clientWidth;
	const WORLD_HEIGHT = document.documentElement.clientHeight;
	$('#pow').css({'left': `${WORLD_WIDTH/2}px`})
	let engine = new MatterEngine(WORLD_WIDTH, WORLD_HEIGHT);
	
	
	let addNum = function(num) {
		let name = keys[num]
		engine.addVoiceroid(name, json[name])
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
	$('#rm-lasttoutch').on('click', e => {
		engine.clear(engine.lastTouches);
	})
	$('#ad-all').on('click', e => {
		let array = [...keys]
		for(var i = array.length - 1; i > 0; i--){
			var r = Math.floor(Math.random() * (i + 1));
			var tmp = array[i];
			array[i] = array[r];
			array[r] = tmp;
		}
		for (let key of array) {
			engine.addVoiceroid(key, json[key])
		}
	})
	$('#ad-rnd').on('click', e => {
		let num = Math.floor(Math.random() * keys.length);
		addNum(num)
	})
	$('.drawer-menu-item.img').on('click', e => {
		let num = Number($(e.target).attr('num'))
		addNum(num-1)
	})
	
	// pow
	$('#pow').on('click', e => {
		engine.explosion()
	})
	
	
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


