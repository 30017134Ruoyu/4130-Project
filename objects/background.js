import * as THREE from "three";
import { MeteorSystem } from './meteor.js';
import { CameraWarpEffect } from './warp.js';

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Create background stars - preserve original textures and twinkling effect
function createStars(count, radius) {
    const starsGroup = new THREE.Group();
     
    // Load star texture - maintain original texture loading attempt
    let starTexture;
    try {
        starTexture = textureLoader.load('/assets/sprite120.png');  
    } catch (e) {
        console.warn("error");
    }
    
    // Create a set of twinkling stars
    const stars = [];
    for (let i = 0; i < count; i++) {
        // Random position, stars distributed within range
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
         
        // Adjust distribution so stars are at more noticeable distances
        const r = radius * (1.5 + 1 * Math.random()); // Stars distributed in 50%-100% radius range for better visibility
        
        const position = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        
        // Star colors - brighter 
        const colorRand = Math.random();
        const color = new THREE.Color();
        
        if (colorRand > 0.95) {
            color.setHSL(0.05, 0.9, 1.0); // Red
        } else if (colorRand > 0.9) {
            color.setHSL(0.15, 0.8, 1.0); // Yellow
        } else if (colorRand > 0.85) {
            color.setHSL(0.6, 0.7, 1.0);  // Blue
        } else {
            color.setHSL(0.0, 0.0, 1.0);  // White
        }
        
        // Create sprite material - use texture if available, otherwise use default material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            color: color,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5, // Higher opacity, 0.5-1.0
            blending: THREE.AdditiveBlending
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        
        // Use small stars but ensure they're visible
        const size = 900 + Math.random() * 300; 
        
        sprite.scale.set(size, size, 1);
        starsGroup.add(sprite);
        
        // Store star data
        stars.push({
            sprite: sprite,
            speed: 0.1 + Math.random() * 0.3,  // Speed
            phase: Math.random() * Math.PI * 2, 
            min: 0.3 + Math.random() * 0.2,     
            max: 0.7 + Math.random() * 0.3     
        });
    }
    
    // Start independent timer to update twinkling
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

// Create background skybox - preserve original texture
function createSkybox() {
    const geometry = new THREE.SphereGeometry(500000, 32, 32);
    let texture;
    try {
        texture = textureLoader.load('/assets/stars.jpg');
        texture.colorSpace = THREE.SRGBColorSpace;
    } catch (e) {
        console.warn("Unable to load skybox texture, using solid color background");
    }
    
    // Use texture if loading successful, otherwise use solid color
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,  
        fog: false,
        color: texture 
    });
    
    const skybox = new THREE.Mesh(geometry, material);
    return skybox;
}

// Create background - maintain same interface as original code
function createBackground(scene) {
    // Create skybox
    const skybox = createSkybox();
    scene.add(skybox);
    
    // Create stars
    const stars = createStars(1000, 200000);
    scene.add(stars.starsGroup);
    
    // Create meteor system
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
    
    // Camera storage
    let cameraWarpEffect = null;
    let shipCamera = null;
    let godCamera = null;
    
    // Press Shift to activate warp
    let isShiftPressed = false;
    
    // Keyboard bindings
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
    
    // Add keyboard listeners
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    
    // Return object compatible with original interface
    return {
        // Initialize cameras
        initCameras: (spaceshipCamera, globalCameraRef) => {
            shipCamera = spaceshipCamera;
            godCamera = globalCameraRef;
            
            // Create warp effect
            cameraWarpEffect = new CameraWarpEffect(scene, shipCamera, {
                lineCount: 500,       // Reduce line count
                color: 0x88ccff,      
                speedFactor: 1.0,     
                spawnRadius: 1.8      
            });
        },
        
        // Animation update
        animate: (delta, currentCameraMode) => {
            // Update meteors
            if (meteorSystem) {
                meteorSystem.update(delta);
            }
            
            // Only update warp effect in spaceship view
            if (cameraWarpEffect && currentCameraMode === "Spaceship") {
                const activeCamera = currentCameraMode === "Spaceship" ? shipCamera : godCamera;
                if (activeCamera) {
                    cameraWarpEffect.camera = activeCamera;
                    cameraWarpEffect.update(delta, isShiftPressed);
                }
            }
        },
        
        
        // Export
        meteorSystem,
        getWarpEffect: () => cameraWarpEffect
    };
}

export { createBackground };