import * as THREE from "three";
import { MeteorSystem } from './meteor.js';
import { CameraWarpEffect } from './warp.js';

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Create more visible small stars (background stars)
function createStars(count = 3000, radius = 200000) {
    const starsGroup = new THREE.Group();
     
    // 加载星星纹理 Loading the star texture
    let starTexture;
    try {
        starTexture = textureLoader.load('/assets/image.png');  // should be sprite120.png but I think this one is better.
    } catch (e) {

    }
    
    // Create a set of twinkling star sprites
    const stars = [];
    for (let i = 0; i < count; i++) {
        //  Random position, stars are distributed within the range
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
         
        // Adjust the distribution so that the stars are at a more obvious distance
        const r = radius * (0.5 + 0.5 * Math.random()); // The stars are distributed in the 50%-100% radius range and are more obvious.
        
        const position = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        
        // star color - much more bright 
        const colorRand = Math.random();
        const color = new THREE.Color();
        
        if (colorRand > 0.95) {
            color.setHSL(0.05, 0.9, 1.0); // red
        } else if (colorRand > 0.9) {
            color.setHSL(0.15, 0.8, 1.0); // yellow
        } else if (colorRand > 0.85) {
            color.setHSL(0.6, 0.7, 1.0);  // blue
        } else {
            color.setHSL(0.0, 0.0, 1.0);  // white
        }
        
        // Creating a Sprite Material - Increasing Brightness and Opacity
        const spriteMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            color: color,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5, // Higher opacity, 0.5-1.0
            blending: THREE.AdditiveBlending
        });
        
        // Creating a sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        
        // Use small stars, but make sure they are visible
        const size = 200 + Math.random() * 200; // Smaller stars, but bigger than before, 200-400
        
        sprite.scale.set(size, size, 1);
        starsGroup.add(sprite);
        
        // store 
        stars.push({
            sprite: sprite,
            speed: 0.1 + Math.random() * 0.3,  // speed
            phase: Math.random() * Math.PI * 2, 
            min: 0.3 + Math.random() * 0.2,     
            max: 0.7 + Math.random() * 0.3     
        });
    }
    
    // Start independent timer to update flash
    const twinkleInterval = setInterval(() => {
        const time = Date.now() / 1000; 
        
        stars.forEach(star => {
            const opacity = star.min + (star.max - star.min) * 
                           (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
            star.sprite.material.opacity = opacity;
        });
    }, 16); // ~60fps
    
    return {
        starsGroup,
        cleanup: () => {
            clearInterval(twinkleInterval);
        }
    };
}

// Creating a Background Skybox
function createSkybox() {
    const geometry = new THREE.SphereGeometry(500000, 32, 32);
    let texture;
    try {
        texture = textureLoader.load('/assets/stars.jpg');
        texture.colorSpace = THREE.SRGBColorSpace;
    } catch (e) {
       
    }
    
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,  
        fog: false 
    });
    
    const skybox = new THREE.Mesh(geometry, material);
    return skybox;
}

function createBackground(scene) {
    const skybox = createSkybox();
    scene.add(skybox);
    
    const stars = createStars(3000, 200000);
    scene.add(stars.starsGroup);
    
    // meteor system
    const meteorSystem = new MeteorSystem(scene, {
        count: 20,              
        maxDistance: 200000,    
        minSpeed: 2000,        
        maxSpeed: 8000,      
        minSize: 100,           
        maxSize: 300,          
        color: 0xFFFFFF,        
        trailLength: 15,        
        frequency: 0.03        
    });
    
    // camera storage
    let cameraWarpEffect = null;
    let shipCamera = null;
    let godCamera = null;
    
    // press shift to activate warp
    let isShiftPressed = false;
    
    // keyborad bind
    const onKeyDown = (e) => {
        if (e.code === "ShiftLeft") {
            isShiftPressed = true;
        }
    };
    
    const onKeyUp = (e) => {
        if (e.code === "ShiftLeft") {
            isShiftPressed = false;
        }
    };
    
    // add keyboard listener
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    
    return {
        // init
        initCameras: (spaceshipCamera, globalCameraRef) => {
            shipCamera = spaceshipCamera;
            godCamera = globalCameraRef;
            
            // create warp scene
            cameraWarpEffect = new CameraWarpEffect(scene, shipCamera, {
                lineCount: 1000,       
                color: 0x88ccff,      
                speedFactor: 1.0,     
                spawnRadius: 1.8      
            });
        },
        
        
        animate: (delta, currentCameraMode) => {
            if (meteorSystem) {
                meteorSystem.update(delta);
            }
            // only on spaceship view
            if (cameraWarpEffect && currentCameraMode === "Spaceship") {
                const activeCamera = currentCameraMode === "Spaceship" ? shipCamera : godCamera;
                if (activeCamera) {
                    cameraWarpEffect.camera = activeCamera;
                    cameraWarpEffect.update(delta, isShiftPressed);
                }
            }
        },
        
        // clean
        cleanup: () => {
            stars.cleanup();
            
            if (meteorSystem) {
                meteorSystem.dispose();
            }
            
            if (cameraWarpEffect) {
                cameraWarpEffect.dispose();
            }
            
            // remove eventlistener
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        },
        
        // export
        meteorSystem,
        getWarpEffect: () => cameraWarpEffect
    };
}

export { createBackground };