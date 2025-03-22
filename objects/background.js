import * as THREE from "three";

// 纹理加载器 Texture Loader
const textureLoader = new THREE.TextureLoader();

// 创建更明显的小星星（背景星空）Create more visible small stars (background stars)
function createStars(count = 3000, radius = 200000) {
    const starsGroup = new THREE.Group();
     
    // 加载星星纹理 Loading the star texture
    let starTexture;
    try {
        starTexture = textureLoader.load('/assets/image.png');  // should be sprite120.png but I think this one is better.
    } catch (e) {

    }
    
    // 创建一组闪烁星星的精灵 Create a set of twinkling star sprites
    const stars = [];
    for (let i = 0; i < count; i++) {
        // 随机位置，星星分布在范围内 Random position, stars are distributed within the range
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
         
        // 调整分布，让星星分布在更明显的距离  Adjust the distribution so that the stars are at a more obvious distance
        const r = radius * (0.5 + 0.5 * Math.random()); // 星星分布在50%-100%的半径范围，更明显 The stars are distributed in the 50%-100% radius range and are more obvious.
        
        const position = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        
        // 星星颜色 - 更明亮
        const colorRand = Math.random();
        const color = new THREE.Color();
        
        if (colorRand > 0.95) {
            color.setHSL(0.05, 0.9, 1.0); // 明亮红色  red
        } else if (colorRand > 0.9) {
            color.setHSL(0.15, 0.8, 1.0); // 明亮黄色 yellow
        } else if (colorRand > 0.85) {
            color.setHSL(0.6, 0.7, 1.0);  // 明亮蓝色 blue
        } else {
            color.setHSL(0.0, 0.0, 1.0);  // 纯白色 white
        }
        
        // 创建精灵材质 - 提高亮度和不透明度 Creating a Sprite Material - Increasing Brightness and Opacity
        const spriteMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            color: color,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5, // 较高的不透明度，0.5-1.0 Higher opacity, 0.5-1.0
            blending: THREE.AdditiveBlending
        });
        
        // 创建精灵 Creating a sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        
        // 使用小尺寸星星，但确保可见 Use small stars, but make sure they are visible
        const size = 200 + Math.random() * 200; // 小尺寸的星星，但比之前大一些，200-400 Smaller stars, but bigger than before, 200-400
        
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
    
    // 启动独立计时器更新闪烁 Start independent timer to update flash
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

// 创建背景天空盒 Creating a Background Skybox
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
    
    return {
        animate: () => {},
        cleanup: stars.cleanup
    };
}

export { createBackground };