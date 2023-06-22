import * as THREE from './libs/threejs/build/three.module.js';
import { GLTFLoader } from './libs/threejs/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from './libs/tween.esm.js';
// Scene params

const models = {
	crash:    { url: './assets/crash4.glb' },
	aku_aku:  { url: './assets/aku_aku2.glb'},
	box:  { url: './assets/box.glb'},
	aku_box:  { url: './assets/aku_box1.glb'},
	//tnt:  { url: './assets/tnt.glb'},
	wumpa:  { url: './assets/wumpa_fruit.glb'},
	rock:  { url: './assets/rock2.glb'},
	platform:	{url: './assets/platform.glb'},
	mappirate: {url: './assets/game_pirate_adventure_map.glb'},
	
	
	spike:	{url:	'./assets/spikes.glb'}
};

const sounds = {
	
	menu: 	{url: './sounds/01-32. Crash Bandicoot (Pre-Console).mp3'},
	bgm:	{url: './sounds/bgm2.wav'},
	box1:	{url: './sounds/box.wav'},
	death:	{url: './sounds/S000000F.NSF_00017.wav'},
	wumpa:	{url: './sounds/S0000003.NSF_00014.wav'},
	box2:	{url: './sounds/S0000003.NSF_00015.wav'},
	enemy:	{url: './sounds/S0000003.NSF_00044.wav'},
	tnt:	{url: './sounds/S0000003.NSF_00060.wav'},
	life:	{url: './sounds/S0000003.NSF_00005.wav'},
	akuaku: {url: './sounds/akuaku.wav'},
	seasound: {url: './sounds/sea.mp3'},
	woa: 	{url: './sounds/woa.mp3'}
};


var keyboard = {};
var scene;
var camera,player,mask,platform;
var playerBones = {};
var enemies,collectibles, akuboxes, spikes,rocks;
var score;
var totalscore;
var renderer;
var scoreElement;
var gameOverFlag =0;
//Jump
var isJumping = false;
var jumpHeight = 2;
var jumpBoxHeight = 4;
var jumpSpeed = 0.1;
var jumpDir = 1;
var map;
var minX = -1.5;
var maxX = 1.5;
var minZ = 3;
var maxZ = 232;
var health =1;
var playerMask = 0;
var modelsOK = 0,soundsOK = 0;
var backgroundSound, sound, listener, audioLoader, sound2,sound3;
var runTweens = [];
var water;
var gamePause=1;
var dir = 1;

loadModels();
loadSounds();

var blink = document.getElementById("blink");
var blink2 = document.getElementById("gameOverP");
setInterval(function () {
  if (blink.style.opacity == 0) {
    blink.style.opacity = 1;
  } else {
    blink.style.opacity = 0;
  }
}, 1000);
setInterval(function() {
	if(blink2.style.opacity == 0){
		blink2.style.opacity = 1;
	} else {
		blink2.style.opacity = 0;
	}
}, 1000);
function loadModels() {

	const modelsLoaderManager = new THREE.LoadingManager();
	modelsLoaderManager.onLoad = () => {
		
		modelsOK = 1;
		document.querySelector('#models_loading').hidden = true;
		
		if(modelsOK && soundsOK){
			document.querySelector('#entertoplay').hidden = false;
			init();
			
		}
	};
	const modelsProgressBar = document.querySelector('#models_progressbar');
	modelsLoaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading models... ", itemsLoaded / itemsTotal * 100, '%');
		modelsProgressBar.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
	};
	{
		const gltfLoader = new GLTFLoader(modelsLoaderManager);
		for (const model of Object.values(models)) {
			gltfLoader.load(model.url, (gltf) => {
				
				console.log(model);
				
				gltf.scene.traverse( function ( child ) {

					if ( child.isMesh ) {
						if( child.castShadow !== undefined ) {
							child.castShadow = true;
							child.receiveShadow = true;
						}
						//console.log(child.name);
					}
					
						console.log(child.name);
					
				} );
				model.gltf = gltf.scene; 
			});
		}
	} 
}


function loadSounds() {

	const soundsLoaderManager = new THREE.LoadingManager();
	soundsLoaderManager.onLoad = () => {

		soundsOK = 1;
		document.querySelector('#sounds_loading').hidden = true;
		
		if(modelsOK && soundsOK) {
			document.querySelector('#entertoplay').hidden = false;
			init();
		}
	};
	const modelsProgressBar = document.querySelector('#sounds_progressbar');
	soundsLoaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading sounds... ", itemsLoaded / itemsTotal * 100, '%');
		modelsProgressBar.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
	};
	{
		const audioLoader = new THREE.AudioLoader(soundsLoaderManager);
		for (const sound of Object.values(sounds)) {
			audioLoader.load( sound.url, function( buffer ) {
				
				sound.sound = buffer;

				console.log("Loaded ", buffer);
			});
		}
	} 
}


function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
	listener= new THREE.AudioListener();
	camera.add(listener);

	sound = new THREE.Audio(listener);
	sound2 = new THREE.Audio(listener);
	sound3 = new THREE.Audio(listener);
	backgroundSound = new THREE.Audio(listener);
	//SkyBox
	var materialArray = [];
	var texture_front = new THREE.TextureLoader().load('./texture/sky1.jpg');
    var texture_back = new THREE.TextureLoader().load('./texture/sky1.jpg');
	var texture_up = new THREE.TextureLoader().load('./texture/sky1.jpg');
	var texture_down = new THREE.TextureLoader().load('./texture/beach.jpg');
	var texture_right = new THREE.TextureLoader().load('./texture/sea6.jpeg');
	var texture_left = new THREE.TextureLoader().load('./texture/sea6.jpeg');
    
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_front}));
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_back}));
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_up}));
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_down}));
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_right}));
	materialArray.push(new THREE.MeshBasicMaterial({map: texture_left}));	
	
	for (let i= 0; i< 6; i++) materialArray[i].side = THREE.BackSide;
	var skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
	var skybox = new THREE.Mesh(skyboxGeo, materialArray);
	scene.add(skybox);
	audioLoader= new THREE.AudioLoader();
	
	// Player
    player = new THREE.Mesh();
	player.name = "crash";
    var body = models.crash.gltf.getObjectByName('Sketchfab_model');
    body.scale.set(2,2, 2);
	player.position.set(0, 0.1, 4);
    player.add(body);
    initPlayerSkeleton();
    scene.add(player);

	//Map
	map = new THREE.Mesh();
	var mapmesh = models.mappirate.gltf.getObjectByName('Object_2').clone();
	mapmesh.scale.set(0.0034,0.0034,0.0034);
	map.add(mapmesh);
	map.position.set(0.0,0.0,0.0);
	scene.add(map);
	
	//water
	var waterTex = new THREE.TextureLoader().load('./texture/water.jpg');
	var waterMat = new THREE.MeshPhongMaterial({map: waterTex,transparent: true, opacity: 0.5});

	water = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), waterMat);
	water.position.set(0,-1.5,255);
	water.rotation.x = (-Math.PI/2);
	scene.add(water);

	//Aku aku
	mask = new THREE.Mesh();
	var bodymask = models.aku_aku.gltf.getObjectByName('RootNode');
	mask.add(bodymask);
	mask.position.set(0, -5, 0);
	mask.scale.set(0.05,0.05,0.05);
	scene.add(mask);
	
	//end level platform
	
	platform = new THREE.Mesh();
	var plat = models.platform.gltf.getObjectByName('RootNode');
	platform.add(plat);
	platform.position.set(0, 0, 232);
	platform.scale.set(0.005,0.005,0.005);
	scene.add(platform);
	
	
	
	//Rocks
	rocks = [];
	
	
    for (let i = 0; i < 5; i++) {
        
        const rock = new THREE.Mesh();
        var mesh = models.rock.gltf.getObjectByName('Object_2').clone();
        //mesh.scale.set(0.021,0.010,0.017);
        mesh.rotation.x = (Math.PI);
       
        
        rock.add(mesh);
        rock.name = "rock";
        const box1 = new THREE.Box3().setFromObject(rock);
        var dim = new THREE.Vector3();
        box1.getSize(dim);
        console.log(dim);
        rock.position.set(randomIntFromInterval(-1,1), 0.8, randomIntFromInterval(4,200));
        console.log(rock.position);
        
		scene.add(rock);
        rocks.push(rock);
    }
	
	//Spikes
	spikes = [];
	
	
    for (let i = 0; i < 5; i++) {
        
        const spike = new THREE.Mesh();
        var mesh = models.spike.gltf.getObjectByName('RootNode').clone();
        mesh.scale.set(0.021,0.010,0.017);
        mesh.rotation.x = (Math.PI);
       
        
        spike.add(mesh);
        spike.name = "spike";
        const box1 = new THREE.Box3().setFromObject(spike);
        var dim = new THREE.Vector3();
        box1.getSize(dim);
        console.log(dim);
        spike.position.set(randomIntFromInterval(-1,1), 0, randomIntFromInterval(6,230));
        
		scene.add(spike);
        spikes.push(spike);
    }
	
	
    // Enemies
    enemies = [];

    for (let i = 0; i < 5; i++) {
        
        const enemy = new THREE.Mesh();
        var mesh = models.box.gltf.getObjectByName('Object_4').clone();
        mesh.scale.set(0.4,0.4,0.4);
        
        enemy.add(mesh);
        
        enemy.position.set(randomIntFromInterval(-1,1), 0.5, randomIntFromInterval(6,230));
        
		scene.add(enemy);
        enemies.push(enemy);
    }

	// Akuboxes
	akuboxes = [];
	for (let i = 0; i < 3; i++) {
        
		const akubox = new THREE.Mesh();
		akubox.name = "aku";
		var bodyakubox = models.aku_box.gltf.getObjectByName('Sketchfab_model').clone();
		akubox.add(bodyakubox);
		akubox.position.set(randomIntFromInterval(-1,1), 0.5, randomIntFromInterval(6,230));
		akubox.scale.set(0.5,0.5,0.5);
		scene.add(akubox);
		akuboxes.push(akubox);
    }

    // Collectibles
    collectibles = [];
    for (let i = 0; i < 100; i++) {
        
        const collectible = new THREE.Mesh();  
        var mesh = models.wumpa.gltf.getObjectByName('Sketchfab_model').clone();
		mesh.scale.set(0.05,0.05,0.05);
        collectible.add(mesh);

        collectible.position.set(randomIntFromInterval(-1,1),0.5, randomIntFromInterval(6,230));
        scene.add(collectible);
        collectibles.push(collectible);
    }

    // User interaction
		document.addEventListener('keydown', function(event) {
			keyboard[event.code] = true;
		});
		document.addEventListener('keyup', function(event) {
			keyboard[event.code] = false;
		});
	
	playRunAnimation();
    // Lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
	scene.add(ambientLight);

	const directLight = new THREE.DirectionalLight(0xaea04b, 3, 100);
	directLight.position.set(0, 500, 125);
	
	var directLightTargetObject = new THREE.Object3D();
	directLightTargetObject.position.set(0, 0, 125);
	scene.add(directLightTargetObject);
	directLight.target = directLightTargetObject;
	
	directLight.castShadow = true;
	directLight.shadow.mapSize.width = 512;
	directLight.shadow.mapSize.height = 512;

	directLight.shadow.camera.left = -10;
	directLight.shadow.camera.right = 10;
	directLight.shadow.camera.top = 140;
	directLight.shadow.camera.bottom = 0;
	directLight.shadow.camera.near = 30;
	directLight.shadow.camera.far = 55;
	directLight.shadow.bias = 0.0009;

	scene.add(directLight);

	
    // Game variables
    score = 0;
	totalscore=0;
    scoreElement = document.createElement('div');
    document.body.appendChild(scoreElement);
	
    animate();
}


function initPlayerSkeleton(){
	
	player.traverse( b =>  {
		if (b.isBone && b.name === 'root_152') { 
			playerBones.torso = b;
		}
		if (b.isBone && b.name === 'hip_r_150') { 
			playerBones.rightUpperLeg = b;
		}
		if (b.isBone && b.name === 'calf_r_145') { 
			playerBones.rightLowerLeg = b;
		}
		if (b.isBone && b.name === 'hip_l_139') { 
			playerBones.leftUpperLeg = b;
		}
		if (b.isBone && b.name === 'calf_l_134') { 
			playerBones.leftLowerLeg = b;
		}
		if (b.isBone && b.name === 'upperarm_r_119') { 
			playerBones.rightUpperArm = b;
		}
		if (b.isBone && b.name === 'lowerarm_r_115') { 
			playerBones.rightLowerArm = b;
		}
		if (b.isBone && b.name === 'upperarm_l_27') { 
			playerBones.leftUpperArm = b;
		}
		if (b.isBone && b.name === 'lowerarm_l_23') { 
			playerBones.leftLowerArm = b;
		}
		if (b.isBone && b.name === 'head_91') { 
			playerBones.head = b;
		}
		if (b.isBone && b.name === 'nose_01_31') { 
			playerBones.nose = b;
		}
		if (b.isBone && b.name === 'ear_01_r_37') { 
			playerBones.rightEar = b;
		}
		if (b.isBone && b.name === 'ear_01_l_34') { 
			playerBones.leftEar = b;
		}
		
	});

}

function checkCollision(object1, object2){
	const box1 = new THREE.Box3().setFromObject(object1);
	const box2 = new THREE.Box3().setFromObject(object2);
	
	box1.expandByScalar(-0.15);
	box2.expandByScalar(-0.08);
	

	if(object2.name == "spike"){
		box2.expandByScalar(-0.55);
	}
	if(object2.name == "rock"){
		box2.expandByScalar(-0.55);
	}
	
	return box1.intersectsBox(box2);
}

// Game loop
function animate() {
	requestAnimationFrame(animate);
	console.log(playerBones.leftLowerLeg.rotation);
	console.log(playerBones.rightLowerLeg.rotation);
	
	
	sound3.setVolume(player.position.z/1000);
	
	
	if(keyboard['Enter'] && gamePause) startGame();
	else{
	if(!gameOverFlag){
	if(playerMask) mask.position.set(player.position.x -1, player.position.y+1 , player.position.z);
	if (keyboard['KeyW']) {
		if(player.position.z < maxZ){
			player.position.z += 0.1;
			if(playerBones.torso.rotation.y != 0) {
				playerBones.torso.rotation.y=0;
				mask.rotation.y = 0;
			}
			if(playerMask) mask.position.z +=0.1;
			TWEEN.update();
		}		
	}
	if (keyboard['KeyS']) {
		if (player.position.z > minZ) {
			player.position.z -= 0.1;
			playerBones.torso.rotation.y = (Math.PI );
			if(!keyboard['KeyW']) TWEEN.update();
			if(playerMask){
				mask.position.z -=0.1;
				mask.rotation.y = Math.PI;
			}
		}
	}
	if (keyboard['KeyA']) {
		if (player.position.x < maxX) {
			player.position.x += 0.1;
			playerBones.torso.rotation.y = (Math.PI /2);
			if(!keyboard['KeyW']) TWEEN.update();
			if(playerMask) mask.position.x +=0.1;
		}
	}
	if (keyboard['KeyD']) {
		if (player.position.x > minX) {
			player.position.x -= 0.1;
			playerBones.torso.rotation.y = (-Math.PI /2);
			if(!keyboard['KeyW']) TWEEN.update();
			if(playerMask) mask.position.x -=0.1;
		}
	}
	if (keyboard['Space'] && !isJumping){
		isJumping = true;
		jumpDir = 1;
	} 
	if (isJumping){
		pauseTweens(runTweens);
		playJumpAnimation();
		player.position.y += jumpDir * jumpSpeed;
		if(player.position.y >= jumpHeight){
			jumpDir = -1;
		} else if (player.position.y <= 0){
			playJumpEndAnimation();
			resumeTweens(runTweens);
			isJumping = false;
			player.position.y = 0.0;
		}
	}
	}
}
	// Update camera position
	camera.position.copy(player.position);
	camera.position.y += 2;
	camera.position.z -= 3;
	camera.lookAt(player.position);
	
	
	// Update game logic
	
	// check if the player has arrived to the end level platform
	if (checkCollision(player, platform)) {
		player.position.y = 0.25;
		document.getElementById('fruits2').textContent = totalscore;
		gameEnd();
	}
	
	//animate and check collison with rocks
	for (let i = 0; i < rocks.length; i++) {
		const rock = rocks[i];
		if(!gameOverFlag){
		if(rock.position.x + 0.05 < maxX + 1 && dir == 1){
			rock.position.x += 0.05;
			rock.rotation.z -= 0.05;
		}else{
			dir = 0;
		}
		if(!dir && rock.position.x - 0.05 > -maxX - 1){
			rock.position.x -= 0.05;
			rock.rotation.z += 0.05;
		}else{
			dir = 1;
		}
	} 

		if (checkCollision(player, rock)) {
			playWoaSound();
			isJumping = true;
			jumpDir = 1;
			player.position.y += jumpDir * jumpSpeed;
			player.position.z +=2.5;

			// Decrease the score and health
			if(playerMask){
				playerMask = 0;
				mask.position.set(0 -2, 0);
			}else{
				health--;
				if(health == 0){
				//implement game over logic
					document.getElementById('fruits2').textContent = totalscore;
					gameOver();
				}
			}		

			document.getElementById('health').textContent =health;
			camera.position.copy(player.position);
			camera.position.y += 2;
			camera.position.z -= 3;
			camera.lookAt(player.position);

		}
	}
	
	
	//Check collisions with spikes
	for (let i = 0; i < spikes.length; i++) {
		const spike = spikes[i];

		if (checkCollision(player, spike)) {
			playWoaSound();
			isJumping = true;
			jumpDir = 1;
			player.position.y += jumpDir * jumpSpeed;
			player.position.z +=2.5;

			// Decrease the score and health
			if(playerMask){
				playerMask = 0;
				mask.position.set(0,-3,0);
			}else{
				health--;
				if(health == 0){
				//implement game over logic
					document.getElementById('fruits2').textContent = totalscore;
					gameOver();
				}
			}		

			document.getElementById('health').textContent =health;
			camera.position.copy(player.position);
			camera.position.y += 2;
			camera.position.z -= 3;
			camera.lookAt(player.position);

		}
	}

	
	
	for (let i = 0; i < enemies.length; i++) {
		const enemy = enemies[i];
		
		if (checkCollision(player, enemy)) {
			const playerBottom = player.position.y - (playerBones.torso ? playerBones.torso.position.y : 0);
			// Check if the player's bottom position is above the enemy's top
			if (playerBottom >= enemy.position.y && isJumping) {
			  // Remove the box from the scene
			  playBoxSound();
			  scene.remove(enemy);
			  enemies.splice(i, 1);
			  i--;
			  isJumping = true;
			  jumpDir = 1;
			  player.position.y += jumpDir * jumpSpeed;
			  if(player.position.y >= jumpBoxHeight){
				  jumpDir = -1;
			  } else if (player.position.y <= 0){
				  isJumping = false;
				  player.position.y = 0.0;
			  }
			  // Increase the score and health
			  score+=5;
			  totalscore+=5;
			  if(score >=15){
				playHealthSound();
				health++;
				document.getElementById('health').textContent =health;
				score=0;
			  }
			  document.getElementById('fruits').textContent = score;
			}else{
			if (keyboard['KeyW']) {
				player.position.z -= 0.1;
				if(playerMask) mask.position.z -=0.1;
			}
			if (keyboard['KeyS']) {
				player.position.z += 0.1;
				if(playerMask) mask.position.z +=0.1;
			}
			if (keyboard['KeyA']) {
				player.position.x -= 0.1;
				if(playerMask) mask.position.x -=0.1;
			}
			if (keyboard['KeyD']) {
				player.position.x += 0.1;
				if(playerMask) mask.position.x +=0.1;
			}
			camera.position.copy(player.position);
			camera.position.y += 2;
			camera.position.z -= 3;
			camera.lookAt(player.position);
		}	
		}
	}

	for (let i = 0; i < akuboxes.length; i++) {
		const akubox = akuboxes[i];
		
		if (checkCollision(player, akubox)) {
			const playerBottom = player.position.y - (playerBones.torso ? playerBones.torso.position.y : 0);
			// Check if the player's bottom position is above the enemy's top
			if (playerBottom >= akubox.position.y && isJumping) {
			  // Remove the box from the scene
			  playMaskSound();
			  scene.remove(akubox);
			  akuboxes.splice(i, 1);
			  i--;
			  isJumping = true;
			  jumpDir = 1;
			  player.position.y += jumpDir * jumpSpeed;
			  if(player.position.y >= jumpBoxHeight){
				  jumpDir = -1;
			  } else if (player.position.y <= 0){
				  isJumping = false;
				  player.position.y = 0.0;
			  }
			  // Increase the score and health
			  playerMask = 1;
			}else{
				if (keyboard['KeyW']) {
					player.position.z -= 0.1;
					if(playerMask) mask.position.z -=0.1;
				}
				if (keyboard['KeyS']) {
					player.position.z += 0.1;
					if(playerMask) mask.position.z +=0.1;
				}
				if (keyboard['KeyA']) {
					player.position.x -= 0.1;
					if(playerMask) mask.position.x -=0.1;
				}
				if (keyboard['KeyD']) {
					player.position.x += 0.1;
					if(playerMask) mask.position.x +=0.1;
				}
			camera.position.copy(player.position);
			camera.position.y += 2;
			camera.position.z -= 3;
			camera.lookAt(player.position);
		}	
		}
	}

	for (let i = 0; i < collectibles.length; i++) {
		const collectible = collectibles[i];
		if(!gameOverFlag) collectible.rotation.y += 0.05;
		if (checkCollision(player, collectible)) {
			// Collectible logic
			playWumpaSound();
			scene.remove(collectible);
			collectibles.splice(i, 1);
			score++;
			totalscore++;
			if(score >=15){
				playHealthSound();
				health++;
				document.getElementById('health').textContent =health;
				score=0;
			  }
			document.getElementById('fruits').textContent = score;
			i--;
		}
	}

	renderer.render(scene, camera);
}
//animation functions
function rad(degrees){
	var pi = Math.PI;
	return degrees * (pi/180);
}

function pauseTweens(tweens) {
	tweens.forEach( 
		(tween) => {
			tween.pause();
		} 
	);
}

function resumeTweens(tweens) {
	tweens.forEach( 
		(tween) => {
			tween.resume();
		} 
	);	
}

//sound functions
function playBackMusic(){
	backgroundSound.isPlaying = false;
	backgroundSound.setBuffer(sounds.bgm.sound);
	backgroundSound.setLoop(true);
	backgroundSound.setVolume(0.3);
	backgroundSound.autoPlay = true;
	backgroundSound.play();
}

function playWumpaSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.wumpa.sound);
	sound.setVolume(0.15);
	sound.play();
}
function playWoaSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.woa.sound);
	sound.setVolume(0.4);
	sound.play();
}
function playBoxSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.box1.sound);
	sound.setVolume(0.4);
	sound.play();
}
function playHealthSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.life.sound);
	sound.setVolume(0.4);
	sound.play();
}
function playSeaSound(){
	sound3.isPlaying = false;
	sound3.setBuffer(sounds.seasound.sound);
	sound3.setLoop(true);
	sound3.setVolume(0.002);
	sound3.play();
}
function playMaskSound(){
	sound2.isPlaying = false;
	sound2.setBuffer(sounds.akuaku.sound);
	sound2.setVolume(3.0);
	sound2.play();
}

function playRunAnimation(){

	let step_time= 500;

	let max_angle = 60;
	
	playerBones.rightUpperLeg.rotation.z -=rad(0.7*max_angle);
	playerBones.leftUpperLeg.rotation.z -=rad(max_angle);
		
	
	playerBones.leftLowerArm.rotation.z = rad(-45);
	playerBones.rightLowerArm.rotation.z = rad(45);

	
	var left_up_leg_tween = new TWEEN.Tween(playerBones.leftUpperLeg.rotation)
	.to({z:playerBones.leftUpperLeg.rotation.z + rad(1.8*max_angle) }, step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	var left_low_leg_tween = new TWEEN.Tween(playerBones.leftLowerLeg.rotation)
	.to({z:playerBones.leftLowerLeg.rotation.z - rad(0.7*max_angle) }, step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	
	
	
	var right_up_leg_tween = new TWEEN.Tween(playerBones.rightUpperLeg.rotation)
	.to({z:rad(0.5*max_angle)},step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	
	var right_low_leg_tween = new TWEEN.Tween(playerBones.rightLowerLeg.rotation)
	.to({z:playerBones.rightLowerLeg.rotation.z + rad(0.3*max_angle) }, step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	playerBones.leftUpperArm.rotation.z-=rad(max_angle);
	playerBones.rightUpperArm.rotation.z-=rad(max_angle/2);
	
	var left_arm_tween = new TWEEN.Tween(playerBones.leftUpperArm.rotation)
	.to({z: playerBones.leftUpperArm.rotation.z +rad(1.5*max_angle) },step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	var right_arm_tween = new TWEEN.Tween(playerBones.rightUpperArm.rotation)
	.to({z: playerBones.rightUpperArm.rotation.z + rad(max_angle) },step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	var left_low_arm_tween = new TWEEN.Tween(playerBones.leftLowerArm.rotation)
	.to({z: playerBones.leftLowerArm.rotation.z + rad(max_angle/2) },step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	var right_low_arm_tween = new TWEEN.Tween(playerBones.rightLowerArm.rotation)
	.to({z: playerBones.rightLowerArm.rotation.z + rad(max_angle) },step_time)
	.easing(TWEEN.Easing.Quadratic.Out)
	.repeat(Infinity)
	.yoyo(true);
	
	left_up_leg_tween.start();
	right_up_leg_tween.start();
	left_low_leg_tween.start();
	right_low_leg_tween.start();
	left_arm_tween.start();
	right_arm_tween.start();
	left_low_arm_tween.start();
	right_low_arm_tween.start();

	runTweens.push(left_up_leg_tween);
	runTweens.push(right_up_leg_tween);
	runTweens.push(left_low_leg_tween);
	runTweens.push(right_low_leg_tween);
	runTweens.push(left_arm_tween);
	runTweens.push(right_arm_tween);
	runTweens.push(right_low_arm_tween);
	runTweens.push(left_low_arm_tween);
	
	
}

function playJumpAnimation(){
	playerBones.leftLowerArm.rotation.z = rad(-45);
	playerBones.rightLowerArm.rotation.z = rad(45);
	playerBones.leftUpperArm.rotation.y = rad(-40);
	playerBones.rightUpperArm.rotation.y = rad(40);
	playerBones.leftUpperArm.rotation.z = rad(-90);
	playerBones.rightUpperArm.rotation.z = rad(90);
	playerBones.leftUpperLeg.rotation.z = -3.0726950651475753;
	playerBones.rightUpperLeg.rotation.z = 0;
}
function playJumpEndAnimation(){
	playerBones.leftUpperArm.rotation.y = 0.21161608042639796;
	playerBones.rightUpperArm.rotation.y = -0.21161608042639796;
	playerBones.leftUpperArm.rotation.z = -0.35863229964530635;
	playerBones.rightUpperArm.rotation.z = +0.35863229964530635;
}

function randomIntFromInterval(min, max) { // min and max included 
	return Math.floor(Math.random() * (max - min + 1) + min)
  }
function startGame(){
	document.getElementById("main_menu").hidden = true;
	document.getElementById("score_box").hidden = false;
	playBackMusic();
	playSeaSound();
	gamePause=0;
}
function gameOver(){
	gameOverFlag= 1;
	document.getElementById("game_over").hidden = false;
	document.getElementById("score_box").hidden = true;
	backgroundSound.pause();
	sound3.pause();
}
function gameEnd(){
	gameOverFlag= 1;
	document.getElementById("game_over1").hidden = false;
	document.getElementById("score_box").hidden = true;
	backgroundSound.pause();
	sound3.pause();
}

