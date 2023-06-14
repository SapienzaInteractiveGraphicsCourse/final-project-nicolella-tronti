import * as THREE from './libs/threejs/build/three.module.js';
import { GLTFLoader } from './libs/threejs/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from './libs/tween.esm.js';
// Scene params

const models = {
	crash:    { url: './assets/crash4.glb' },
	//aku_aku:  { url: './assets/aku_aku.glb'},
	box:  { url: './assets/box.glb'},
	//jump_box:  { url: './assets/jump_box.glb'},
	//tnt:  { url: './assets/tnt.glb'},
	wumpa:  { url: './assets/wumpa_fruit.glb'},
	//rock_sphere:  { url: './assets/rock_sphere.glb'},
	mappirate: {url: './assets/game_pirate_adventure_map.glb'}
};

const sounds = {
	
	menu: 	{url: './sounds/01-32. Crash Bandicoot (Pre-Console).mp3'},
	bgm:	{url: './sounds/bgm1.wav'},
	box1:	{url: './sounds/box.wav'},
	death:	{url: './sounds/S000000F.NSF_00017.wav'},
	wumpa:	{url: './sounds/S0000003.NSF_00014.wav'},
	box2:	{url: './sounds/S0000003.NSF_00015.wav'},
	enemy:	{url: './sounds/S0000003.NSF_00044.wav'},
	tnt:	{url: './sounds/S0000003.NSF_00060.wav'},
	life:	{url: './sounds/S0000003.NSF_00005.wav'}
};


var keyboard = {};
var scene;
var camera,player;
var playerBones = {};
var enemies,collectibles;
var score;
var renderer;
var scoreElement;
//Jump
var isJumping = false;
var jumpHeight = 2;
var jumpSpeed = 0.1;
var jumpDir = 1;
var map;
var minX = -1.5;
var maxX = 1.5;
var minZ = 3;
var health =1;
var modelsOK = 0,soundsOK = 0;
var backgroundSound, sound, listener, audioLoader;
var runTweens = [];
var waveTweens = [];
var wumpaTween;
var water;


loadModels();
loadSounds();


function loadModels() {

	const modelsLoaderManager = new THREE.LoadingManager();
	modelsLoaderManager.onLoad = () => {
		
		modelsOK = 1;
		
		if(modelsOK && soundsOK){
			init();
		}
	};
	{
		const gltfLoader = new GLTFLoader(modelsLoaderManager);
		for (const model of Object.values(models)) {
			gltfLoader.load(model.url, (gltf) => {
				
				//console.log();
				
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


		if(modelsOK && soundsOK) {
			init();
		}
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
	player.position.set(0, 0, 4);
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
	
	var waterTex = new THREE.TextureLoader().load('./texture/water.jpg');
	var waterMat = new THREE.MeshPhongMaterial({map: waterTex,transparent: true, opacity: 0.5});

	water = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), waterMat);
	water.position.set(0,-1.5,255);
	water.rotation.x = (-Math.PI/2);
	scene.add(water);
    // Enemies
    enemies = [];
    for (let i = 0; i < 5; i++) {
        
        const enemy = new THREE.Mesh();
        var mesh = models.box.gltf.getObjectByName('Object_4').clone();
        mesh.scale.set(0.6,0.6,0.6);
        
        enemy.add(mesh);
        
        enemy.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        
		scene.add(enemy);
        enemies.push(enemy);
    }

    // Collectibles
    collectibles = [];
    for (let i = 0; i < 10; i++) {
        
        const collectible = new THREE.Mesh();  
        var mesh = models.wumpa.gltf.getObjectByName('Sketchfab_model').clone();
		mesh.scale.set(0.05,0.05,0.05);
        collectible.add(mesh);

        collectible.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
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
	playBackMusic();
    // Lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
	scene.add(ambientLight);

	const directLight = new THREE.DirectionalLight(0xffffff, 3, 100);
	directLight.position.set(0, 50, player.position.z + 20);
	
	var directLightTargetObject = new THREE.Object3D();
	directLightTargetObject.position.set(0, 0, player.position.z + 20);
	scene.add(directLightTargetObject);
	directLight.target = directLightTargetObject;
	
	directLight.castShadow = true;
	directLight.shadow.mapSize.width = 512;
	directLight.shadow.mapSize.height = 512;

	const d = 60;
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
    scoreElement = document.createElement('div');
    document.body.appendChild(scoreElement);
	
    animate();
}


function initPlayerSkeleton(){
	
	player.traverse( b =>  {
		if (b.isBone && b.name === 'spine_01_128') { 
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
	
	return box1.intersectsBox(box2);
}
function checkCollisionPlayer(player, enemy) {
	const playerBox = new THREE.Box3().setFromObject(player);
	const enemyBox = new THREE.Box3().setFromObject(enemy);
  
	// Get the top position of the enemy
	const enemyTop = enemy.position.y + enemyBox.max.y;
  
	// Check if the player's position is above the top of the enemy
	return (
	  playerBox.min.y <= enemyTop &&
	  playerBox.max.y >= enemyTop &&
	  playerBox.intersectsBox(enemyBox)
	);
  }
// Game loop
function animate() {
	requestAnimationFrame(animate);
	
	if (keyboard['KeyW']) {
		player.position.z += 0.1;
	}
	if (keyboard['KeyS']) {
		if (player.position.z > minZ) {
			player.position.z -= 0.1;
		}
	}
	if (keyboard['KeyA']) {
		if (player.position.x < maxX) {
			player.position.x += 0.1;
		}
	}
	if (keyboard['KeyD']) {
		if (player.position.x > minX) {
			player.position.x -= 0.1;
		}
	}
	if (keyboard['Space'] && !isJumping){
		isJumping = true;
		jumpDir = 1;
	} 
	if (isJumping){
		player.position.y += jumpDir * jumpSpeed;
		if(player.position.y >= jumpHeight){
			jumpDir = -1;
		} else if (player.position.y <= 0){
			isJumping = false;
			player.position.y = 0.0;
		}
	}
	// Update camera position
	camera.position.copy(player.position);
	camera.position.y += 2;
	camera.position.z -= 3;
	camera.lookAt(player.position);

	// Update game logic
	for (let i = 0; i < enemies.length; i++) {
		const enemy = enemies[i];
		
		if (checkCollisionPlayer(player, enemy)) {
			const playerBottom = player.position.y - (playerBones.torso ? playerBones.torso.position.y : 0);
			
			// Check if the player's bottom position is above the enemy's top
			if (playerBottom >= enemy.position.y) {
			  // Remove the box from the scene
			  playBoxSound();
			  scene.remove(enemy);
			  enemies.splice(i, 1);
			  i--;
		
			  // Increase the score and health
			  score+=5;
			  if(score >=15){
				health++;
				document.getElementById('health').textContent =health;
				score=0;
			  }
			  document.getElementById('fruits').textContent = score;
			}else{
			if (keyboard['KeyW']) {
				player.position.z -= 0.1;
			}
			if (keyboard['KeyS']) {
				player.position.z += 0.1;
			}
			if (keyboard['KeyA']) {
				player.position.x -= 0.1;
			}
			if (keyboard['KeyD']) {
				player.position.x += 0.1;
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
		if (checkCollision(player, collectible)) {
			// Collectible logic
			playWumpaSound();
			scene.remove(collectible);
			collectibles.splice(i, 1);
			score++;
			if(score >=15){
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

function stopTweens(tweens) {
	tweens.forEach( 
		(tween) => {
			tween.stop();
		} 
	);
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
	backgroundSound.setVolume(0.5);
	backgroundSound.play();
}

function playWumpaSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.wumpa.sound);
	sound.setVolume(0.3);
	sound.play();
}

function playBoxSound(){
	sound.isPlaying = false;
	sound.setBuffer(sounds.box1.sound);
	sound.setVolume(0.6);
	sound.play();
}

