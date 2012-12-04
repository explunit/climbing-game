/*
https://github.com/explunit/climbing-game

Bugs/Remaining Improvements:
* Bug: jumpSize must be evenly divisible by jumpSpeed
* Enh: score indicator
* Enh: more realistic clouds
* Enh: more realistic platforms
* Enh: flip the player image based on which direction he's facing
* Enh: reduce coupling of cloud & platform objects with player objects. Move scroll indicator to main data?
*/
window.addEventListener('load', loadGame, false);
function loadGame(){
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	var globalSettings = {
		// duplicate these here so we don't directly reference the main canvas inside the game objects
		canvasWidth: canvas.width,
		canvasHeight: canvas.height,
		rowsPerGame: 25,	// rows you have to climb to "win"
		rowInterval: 100,	// pixels between rows
		scrollSpeed: 25,    // how fast (pixels per render cycle) the game scrolls when you reach the next row
		player: {
			jumpSize: 120,  // jump this high on up-arrow
			jumpSpeed: 10,  // how fast the player moves during a jump. Known Bug: jumpSize must be evenly divisible by jumpSpeed
			speed: 5,		// how fast the player moves laterally
			height: 43,
			width: 40
		},
		clouds: {
			count: 10,
			minSize: 10,
			maxSize: 30,
			speed: 1
		},
		platforms: {
			count: 5,		// number of platforms in each row
			minSize: 40,
			maxSize: 90,
			height: 10,
			shrinkRate: 0.5 // how fast the visible platforms shrink
		}
	};

	/////////////////////////////////////////////////////////////////////
	function Player(x, y, settings) {
		if (!(this instanceof Player)) {
			return new Player();
		}
		//private
		var jumpBase = y;
		var jumpTarget = y;
		var scrollBase = y;
		var scrollTarget = y;

		//public
		this.x = x;
		this.y = y;
		this.settings = settings;
	}
	Player.prototype.isInJump = function() {
		return this.jumpBase != this.jumpTarget;
	};
	Player.prototype.isInScroll = function() {
		return this.scrollBase != this.scrollTarget;
	};
	Player.prototype.isOnPlatform = function(platforms) {
		var onPlatform = false;
		for (var i = platforms.length - 1; i >= 0; i--) {
			var plat = platforms[i];
			if (this.x >= plat.x - this.settings.player.width / 2
				&& this.x + this.settings.player.width / 2 <= plat.x + plat.width 
				&& this.y === plat.y - this.settings.player.height) {

				onPlatform = true;
				break;
			}
		}
		return onPlatform;
	};
	Player.prototype.jump = function(platforms) {
		if (!this.isInJump() && this.isOnPlatform(platforms)) {
			this.jumpBase = this.y;
			this.jumpTarget = this.jumpBase - this.settings.player.jumpSize;
		}
	};
	Player.prototype.moveRight = function() {
		this.x = this.x + this.settings.player.speed;
	};
	Player.prototype.moveLeft = function() {
		this.x = this.x - this.settings.player.speed;
	};
	Player.prototype.doPhysics = function(platforms) {
		if (this.isInScroll()) {
			this.y = this.y + this.settings.scrollSpeed;
			if (this.y >= this.scrollTarget) {
				this.scrollTarget = this.scrollBase = this.y;
			}
		} else {
			if (this.isInJump()) {
				this.y = this.y - this.settings.player.jumpSpeed;
				if (this.y <= this.jumpTarget) {
					this.jumpTarget = this.jumpBase = this.y;
				}
			}
			else {
				if (!this.isOnPlatform(platforms)) {
					this.y = this.y + this.settings.player.jumpSpeed;
				} else {
					// when they get to 3rd row we flag for scrolling
					if (this.y < this.settings.canvasHeight - (this.settings.rowInterval * 2) 
						&& !this.isInScroll()) {
						this.scrollBase = this.y;
						this.scrollTarget = this.scrollBase + this.settings.rowInterval;
						data.rowsReached = data.rowsReached + 1;
					}
				}
			}
		}
	};
	Player.prototype.render = function(context) {
		// simplistic "jumping" animation
		var aniframe = 2;
		if (this.isInJump()) aniframe = 0;

		context.save();
		context.setTransform(1,0,0,1,0,0);
		context.translate(this.x+(this.settings.player.width/2), this.y+(this.settings.player.height/2));
		context.drawImage(tileSheet, this.settings.player.width*aniframe,0,this.settings.player.width,this.settings.player.height,-(this.settings.player.width/2),-(this.settings.player.height/2), this.settings.player.width,this.settings.player.height+2);
		context.restore();
	};

	/////////////////////////////////////////////////////////////////////
	function Cloud(x, y, radius, settings) {
		if (!(this instanceof Cloud)) {
			return new Cloud();
		}
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.settings = settings;
	}
	Cloud.getRandom = function(settings) {
		var radius = Math.floor(Math.random()*settings.clouds.maxSize)+settings.clouds.minSize;
		var x = radius*2 + (Math.floor(Math.random()*settings.canvasWidth)-radius*2);
		var y = radius*2 + (Math.floor(Math.random()*settings.canvasHeight)-radius*2);
		return new Cloud(x, y, radius, settings);
	};
	Cloud.prototype.doPhysics = function(player) {
		// scroll if needed
		if (player.isInScroll()) {
			this.y = this.y + this.settings.scrollSpeed;
		} else {
			// in this world, the wind always blows left to right
			this.x = this.x + this.settings.clouds.speed;
			// when the cloud moves beyond canvas to the right, randomly generate an new one
			if (this.x > canvas.width + this.radius) {
				this.y = Cloud.getRandom(this.settings).y;
				this.x = -this.settings.clouds.maxSize;
			}
		}
	};
	Cloud.prototype.render = function(context) {
		context.fillStyle = "white";
		context.beginPath();
		context.arc(this.x,this.y,this.radius,0,Math.PI*2,true);
		context.closePath();
		context.fill();
	};

	/////////////////////////////////////////////////////////////////////
	function Platform(x, y, width, settings) {
		if (!(this instanceof Platform)) {
			return new Platform();
		}
		this.x = x;
		this.y = y;
		this.width = width;
		this.settings = settings;
	}
	Platform.getRandom = function(y, settings) {
		var width = Math.floor(Math.random()*settings.platforms.maxSize)+settings.platforms.minSize;
		var x = Math.floor(Math.random()*settings.canvasWidth);
		return new Platform(x, y, width, settings);
	};
	Platform.prototype.doPhysics = function(player) {
		// scroll if needed
		if (player.isInScroll()) {
			this.y = this.y + this.settings.scrollSpeed;
		} else {
			// shrink the visible platforms
			if (this.y > 0 && this.width > 0) {
				this.width = this.width - this.settings.platforms.shrinkRate/2;
				this.x = this.x + this.settings.platforms.shrinkRate/2;
			}
		}
	};
	Platform.prototype.render = function(context) {
		context.fillStyle = "brown";
		context.fillRect(this.x,this.y,this.width,this.settings.platforms.height);
	};

	/////////////////////////////////////////////////////////////////////
	var data = {
		player : {},
		platforms: [],
		platformLevels: [],
		clouds: [],
		keyPressList: [],
		rowsReached: 2
	};

	function showLose() {
		context.fillStyle = 'red';
		context.fillRect(0, 0, canvas.width, canvas.height);
		setTextStyle();
		context.fillText("Sorry, you lose", 130, 70);
		context.fillText("Press F5 to play again", 120, 140);
	}
	
	function showWin() {
		context.fillStyle = 'green';
		context.fillRect(0, 0, canvas.width, canvas.height);
		setTextStyle();
		context.fillText("You win!", 130, 70);
		context.fillText("Press F5 to play again", 120, 140);
	}

	function playLevel() {
		checkKeys();
		moveGameObjects();
		renderCanvas();
	}
	
	function checkKeys() {
		if (data.keyPressList[keycode.up]) data.player.jump(data.platforms);
		if (data.keyPressList[keycode.left]) data.player.moveLeft();
		if (data.keyPressList[keycode.right]) data.player.moveRight();
	}
	
	function moveGameObjects() {
		data.player.doPhysics(data.platforms);
		// treat clouds and platforms the same with doPhysics. TODO: test the efficiency of continually joining the arrays
		var gameObjects = data.clouds.concat(data.platforms);
		for (var i = gameObjects.length - 1; i >= 0; i--) {
			gameObjects[i].doPhysics(data.player);
		}

		// after everything has moved, check for player off bottom (lose) or top (win)
		if (data.player.y > canvas.height) {
			currentGameStateFunction = showLose;
		} else if (data.rowsReached >= globalSettings.rowsPerGame) {
			currentGameStateFunction = showWin;
		}
	}
	
	function renderCanvas() {
		context.fillStyle = 'lightblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		// I'm cheating by doing the rendering in this particular order so as to not deal with compositing (e.g. destination-atop)
		gameObjects = [data.player].concat(data.platforms, data.clouds);
		for (var i = gameObjects.length - 1; i >= 0; i--) {
			gameObjects[i].render(context);
		}
	}

	function seedGameObjects() {
		// player
		data.player = new Player(canvas.width / 2, canvas.height - globalSettings.platforms.height - globalSettings.player.height, globalSettings);

		// clouds
		for (var i = 0; i < globalSettings.clouds.count; i++) {
			data.clouds.push(Cloud.getRandom(globalSettings));
		}

		// platforms
		// create the y values for the rows of platforms
		var platY = canvas.height - globalSettings.platforms.height;
		while(data.platformLevels.length < globalSettings.rowsPerGame) {
			data.platformLevels.push(platY);
			platY = platY - globalSettings.rowInterval;
		}
		// game starts with a platform across the entire bottom
		data.platforms.push(new Platform(0, data.platformLevels[0], canvas.width, globalSettings));

		// and then the rest are random per row
		for (var p = data.platformLevels.length-1; p >= 1; p--) {
			for (var j = 0; j <= globalSettings.platforms.count; j++) {
				data.platforms.push(Platform.getRandom(data.platformLevels[p], globalSettings));
			}
		}
	}

	function setTextStyle() {
		context.fillStyle    = '#ffffff';
		context.font         = '25px _sans';
		context.textBaseline = 'top';
	}

	// trap keystrokes	
	document.onkeydown=function(e){
		e=e?e:window.event;
		data.keyPressList[e.keyCode]=true;
	};
	document.onkeyup=function(e){
		e=e?e:window.event;
		data.keyPressList[e.keyCode]=false;
	};

	var keycode = {
		left: 37,
		up: 38,
		right: 39,
		down: 40
	};

	// create the initial player position and all the clouds/platforms
	seedGameObjects();
	// set the initial function
	var currentGameStateFunction = playLevel;
	function runGame() {
		currentGameStateFunction();
	}

	// load the tile sheet and when it's finished kick off the game timer
	var tileSheet = new Image();
	tileSheet.addEventListener('load', eventImageLoaded , false);
	tileSheet.src = "jump.png";
	function eventImageLoaded() {
		setInterval(runGame, 33);	
	}
}