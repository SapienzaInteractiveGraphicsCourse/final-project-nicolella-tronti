import * as THREE from './threejs/build/three.module.js';
import { GLTFLoader } from './threejs/examples/jsm/loaders/GLTFLoader.js';
    // Scene setup
    const models = {
        crash:    { url: './assets/crash_bandicoot.glb' }
    };
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
    
                    gltf.scene.traverse( function ( child ) {
    
                        if ( child.isMesh ) {
                            if( child.castShadow !== undefined ) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        }
                        console.log(child.name);
                    } );
                    model.gltf = gltf.scene; 
                });
            }
        } 
    }

function init(){
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
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
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    scene.add(player);

    // Enemies
    const enemies = [];
    for (let i = 0; i < 5; i++) {
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        enemy.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(enemy);
        enemies.push(enemy);
    }

    // Collectibles
    const collectibles = [];
    for (let i = 0; i < 10; i++) {
        const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        collectible.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(collectible);
        collectibles.push(collectible);
    }

    // User interaction
    const keyboard = {};
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
    let score = 0;
    const scoreElement = document.createElement('div');
    document.body.appendChild(scoreElement);
    animate();
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