import * as THREE from './libs/threejs/build/three.module.js';
import { GLTFLoader } from './libs/threejs/examples/jsm/loaders/GLTFLoader.js';

// Scene params

const models = {
	crash:    { url: './assets/crash.glb' },
	aku_aku:  { url: './assets/aku_aku.glb'},
	box:  { url: './assets/box.glb'},
	jump_box:  { url: './assets/jump_box.glb'},
	tnt:  { url: './assets/tnt.glb'},
	wumpa:  { url: './assets/wumpa_fruit.glb'},
	rock_sphere:  { url: './assets/rock_sphere.glb'}
};
var keyboard = {};
var scene;
var camera,player;
var playerBones = {};
var enemies,collectibles;
var score;
var renderer;
var scoreElement;




loadModels();
function loadModels() {

	const modelsLoaderManager = new THREE.LoadingManager();
	modelsLoaderManager.onLoad = () => {
			init();
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

function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Geometry and materials
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const collectibleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const collectibleMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff });

    // Player
    //player = new THREE.Mesh(playerGeometry, playerMaterial);
    
    player = new THREE.Mesh();
	player.name = "crash";
    var body = models.crash.gltf.getObjectByName('crash');
    body.scale.set(.1, .1, .1);
    player.add(body);
    initPlayerSkeleton();
    
    scene.add(player);

    // Enemies
    enemies = [];
    for (let i = 0; i < 5; i++) {
        //const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        
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
        //const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        
        const collectible = new THREE.Mesh();  
        var mesh = models.wumpa.gltf.getObjectByName('Sketchfab_model').clone();
        //console.log(mesh);
		mesh.scale.set(0.05,0.05,0.05);
        collectible.add(mesh);

        collectible.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(collectible);
        collectibles.push(collectible);
    }

    // User interaction
    //const keyboard = {};
    document.addEventListener('keydown', function(event) {
        keyboard[event.code] = true;
    });
    document.addEventListener('keyup', function(event) {
        keyboard[event.code] = false;
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 3, 2);
    scene.add(directionalLight);

    // Game variables
    score = 0;
    scoreElement = document.createElement('div');
    document.body.appendChild(scoreElement);
    animate();
}


function initPlayerSkeleton(){
	
	player.traverse( b =>  {
		if (b.isBone && b.name === 'Bone') { 
			playerBones.torso = b;
		}
		if (b.isBone && b.name === 'Bone001') { 
			playerBones.rightUpperLeg = b;
		}
		if (b.isBone && b.name === 'Bone005') { 
			playerBones.rightLowerLeg = b;
		}
		if (b.isBone && b.name === 'Bone006') { 
			playerBones.leftUpperLeg = b;
		}
		if (b.isBone && b.name === 'Bone007') { 
			playerBones.leftLowerLeg = b;
		}
		if (b.isBone && b.name === 'Bone009') { 
			playerBones.rightUpperArm = b;
		}
		if (b.isBone && b.name === 'Bone010') { 
			playerBones.rightLowerArm = b;
		}
		if (b.isBone && b.name === 'Bone012') { 
			playerBones.leftUpperArm = b;
		}
		if (b.isBone && b.name === 'Bone013') { 
			playerBones.leftLowerArm = b;
		}
		if (b.isBone && b.name === 'Bone008') { 
			playerBones.head = b;
		}
		if (b.isBone && b.name === 'Bone011') { 
			playerBones.nose = b;
		}
		if (b.isBone && b.name === 'Bone014') { 
			playerBones.rightEar = b;
		}
		if (b.isBone && b.name === 'Bone015') { 
			playerBones.leftEar = b;
		}
		
	});

}



// Game loop
function animate() {
	requestAnimationFrame(animate);

	// Handle user input
	if (keyboard['KeyW']) player.position.z -= 0.1;
	if (keyboard['KeyS']) player.position.z += 0.1;
	if (keyboard['KeyA']) player.position.x -= 0.1;
	if (keyboard['KeyD']) player.position.x += 0.1;

	// Update camera position
	camera.position.copy(player.position);
	camera.position.y += 3;
	camera.lookAt(player.position);

	// Update game logic
	for (let i = 0; i < enemies.length; i++) {
		const enemy = enemies[i];
		enemy.rotation.x += 0.02;
		enemy.rotation.y += 0.01;
		enemy.rotation.z += 0.03;
		if (enemy.position.distanceTo(player.position) < 1) {
			// Game over logic
			alert('Game Over! Your score: ' + score);
			location.reload();
			break;
		}
	}

	for (let i = 0; i < collectibles.length; i++) {
		const collectible = collectibles[i];
		if (collectible.position.distanceTo(player.position) < 1) {
			// Collectible logic
			scene.remove(collectible);
			collectibles.splice(i, 1);
			score++;
			scoreElement.innerText = 'Score: ' + score;
			i--;
		}
	}

	renderer.render(scene, camera);
}
