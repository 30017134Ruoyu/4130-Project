import * as THREE from 'three';
import { planetData } from './data.js';

// Calculation method obtained from NASA JPL: https://ssd.jpl.nasa.gov/planets/approx_pos.html

// Convert a date to Julian day
const julianDate = (date) => {
    return (date / 86400000) + 2440587.5;
};

// Calculate the century since J2000
const centuriesSinceJ2000 = (JD) => {
    return (JD - 2451545.0) / 36525.0;
};

// Degree to radians
const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Kepler equation solver
const keplerEquationSolver = (M, e) => {
    let E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));
    let E0;
    do {
        E0 = E;
        E = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    } while (Math.abs(E - E0) > 1e-6);
    return E;
};

// Get planetary positions
const getPlanetPosition = (str, date) => {
    const data = planetData[str];
    const JD = julianDate(date);
    const T = centuriesSinceJ2000(JD);

    // Calculate orbital elements
    var a = data.a[0] + data.a[1] * T;
    a *= planetData.common.AU;
    const e = data.e[0] + data.e[1] * T;
    const I = degreesToRadians(data.I[0] + data.I[1] * T);
    const L = degreesToRadians(data.L[0] + data.L[1] * T);
    const longPeri = degreesToRadians(data.longPeri[0] + data.longPeri[1] * T);
    const longNode = degreesToRadians(data.longNode[0] + data.longNode[1] * T);

    // Calculate orbital parameters
    const w = longPeri - longNode;
    const M = L - longPeri;
    const E = keplerEquationSolver(M, e);

    // Calculate coordinates in the orbital plane
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // Calculate distance and true anomaly
    const r = Math.sqrt(x * x + y * y);
    const v = Math.atan2(y, x);

    // Calculate heliocentric coordinates
    const heliocentricZ = r * (Math.cos(longNode) * Math.cos(v + w) - Math.sin(longNode) * Math.sin(v + w) * Math.cos(I));
    const heliocentricY = r * (Math.sin(v + w) * Math.sin(I));
    const heliocentricX = r * (Math.sin(longNode) * Math.cos(v + w) + Math.cos(longNode) * Math.sin(v + w) * Math.cos(I));

    return new THREE.Vector3(heliocentricX, heliocentricY, heliocentricZ);
};

// Creating Planetary Orbits
function createOrbit(str) {
    const points = [];
    const planet = planetData[str];
    const JD = julianDate(new Date());
    const T = centuriesSinceJ2000(JD);

    // Orbital parameters
    let a = planet.a[0] + planet.a[1] * T;
    a *= planetData.common.AU;
    const e = planet.e[0] + planet.e[1] * T;
    const I = degreesToRadians(planet.I[0] + planet.I[1] * T);
    const longPeri = degreesToRadians(planet.longPeri[0] + planet.longPeri[1] * T);
    const longNode = degreesToRadians(planet.longNode[0] + planet.longNode[1] * T);
    const w = longPeri - longNode;

    // Creating Track Points
    for (let i = 0; i < 10000; i++) {
        const M = 2 * Math.PI * i / 10000;
        const E = keplerEquationSolver(M, e);

        const x = a * (Math.cos(E) - e);
        const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

        const r = Math.sqrt(x * x + y * y);
        const v = Math.atan2(y, x);

        const heliocentricZ = r * (Math.cos(longNode) * Math.cos(v + w) - Math.sin(longNode) * Math.sin(v + w) * Math.cos(I));
        const heliocentricX = r * (Math.sin(longNode) * Math.cos(v + w) + Math.cos(longNode) * Math.sin(v + w) * Math.cos(I));
        const heliocentricY = r * (Math.sin(v + w) * Math.sin(I));

        points.push(new THREE.Vector3(heliocentricX, heliocentricY, heliocentricZ));
    }

    // Creating Track Lines
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: planet.color,
        transparent: true,
        opacity: 0.5
    });
    const orbit = new THREE.Line(geometry, material);

    return orbit;
}

// Creating the Sun
const createSun = (name, radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/sun.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        color: 0xffff00
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    const group = new THREE.Group(); 
    group.add(mesh);

    return group;
};

// Creating Mercury
const createMercury = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/mercury.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mercury';
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return configureAxialTilt(mesh, 'mercury');
};

// Creating Venus
const createVenus = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/venus.jpg`);
    const surfaceTexture = textureLoader.load(`/assets/2k_venus_surface.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'venus';
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return configureAxialTilt(mesh, 'venus');
};

const createEarth = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/earth.jpg`)  
    const bumpMap = textureLoader.load(`/assets/earthbump1k.jpg`);
    const specularMap = textureLoader.load(`/assets/earth_specular_map.png`);
    const normalMap = textureLoader.load(`/assets/2k_earth_nightmap.jpg`);
    
    texture.colorSpace = THREE.SRGBColorSpace;
    bumpMap.colorSpace = THREE.SRGBColorSpace;
    specularMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshPhongMaterial({ 
        map: texture,
        bumpMap: bumpMap,
        bumpScale: 0.05,
        specularMap: specularMap,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });
    
    const earthMesh = new THREE.Mesh(geometry, material);
    earthMesh.name = 'earth';
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;

    const earthGroup = configureAxialTilt(earthMesh, 'earth');
    
    const cloudsTexture = textureLoader.load(`/assets/earthcloudmap.jpg`);
    cloudsTexture.colorSpace = THREE.SRGBColorSpace;
    
    const cloudsGeometry = new THREE.SphereGeometry(radius * 1.02, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
    });
    
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    clouds.castShadow = true;
    clouds.receiveShadow = true;
    
    earthGroup.add(clouds);
   
    
    return earthGroup;
};

// Creating Mars
const createMars = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/mars.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mars';
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return configureAxialTilt(mesh, 'mars');
};

// Creating Jupiter
const createJupiter = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/2k_jupiter.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.6
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'jupiter';
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return configureAxialTilt(mesh, 'jupiter');
};

// Creating Saturn
const createSaturn = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/2k_saturn.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'saturn';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const saturnGroup = configureAxialTilt(mesh, 'saturn');
    
    // Add Saturn's rings
    const ringsTexture = textureLoader.load(`/assets/2k_saturn_ring_alpha.png`);
    ringsTexture.colorSpace = THREE.SRGBColorSpace;
    
    const ringGeometry = new THREE.RingGeometry(
        planetData.saturn.innerRing, 
        planetData.saturn.outerRing, 
        128
    );
    
    // Correct texture mapping to ring geometry
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    const center = (planetData.saturn.innerRing + planetData.saturn.outerRing) * 0.5;
    
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        ringGeometry.attributes.uv.setXY(i, v3.length() < center ? 0 : 1, 1);
    }
    
    const ringMaterial = new THREE.MeshStandardMaterial({
        map: ringsTexture,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.7
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    ring.receiveShadow = true;
    
    saturnGroup.add(ring);
    
    return saturnGroup;
};

// Create Uranus
const createUranus = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/2k_uranus.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'uranus';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const uranusGroup = configureAxialTilt(mesh, 'uranus');
    
    // Rings of Uranus
    if (planetData.uranus.innerRing && planetData.uranus.outerRing) {
        const ringGeometry = new THREE.RingGeometry(
            planetData.uranus.innerRing, 
            planetData.uranus.outerRing, 
            128
        );
        
       // Texture mapping for the ring
        const pos = ringGeometry.attributes.position;
        const v3 = new THREE.Vector3();
        const center = (planetData.uranus.innerRing + planetData.uranus.outerRing) * 0.5;
        
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeometry.attributes.uv.setXY(i, v3.length() < center ? 0 : 1, 1);
        }
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x8899AA,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            roughness: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ring.receiveShadow = true;
        
        uranusGroup.add(ring);
    }
    
    return uranusGroup;
};

// Create Neptune
const createNeptune = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/2k_neptune.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'neptune';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const neptuneGroup = configureAxialTilt(mesh, 'neptune');
    
    // Neptune's Rings
    if (planetData.neptune.innerRing && planetData.neptune.outerRing) {
        const ringGeometry = new THREE.RingGeometry(
            planetData.neptune.innerRing, 
            planetData.neptune.outerRing, 
            128
        );
        
        // Texture mapping for the ring
        const pos = ringGeometry.attributes.position;
        const v3 = new THREE.Vector3();
        const center = (planetData.neptune.innerRing + planetData.neptune.outerRing) * 0.5;
        
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeometry.attributes.uv.setXY(i, v3.length() < center ? 0 : 1, 1);
        }
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x3344AA,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
            roughness: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ring.receiveShadow = true;
        
        neptuneGroup.add(ring);
    }
    
    return neptuneGroup;
};

// Create the moon
const createMoon = (radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/moonmap1k.jpg`);
    const bumpMap = textureLoader.load(`/assets/moonbump1k.jpg`);
    
    texture.colorSpace = THREE.SRGBColorSpace;
    bumpMap.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        bumpMap: bumpMap,
        bumpScale: 0.005,
        roughness: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'moon';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
};

// Create the universe background
const createUniverse = (name, radius) => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/stars.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.BackSide,
        fog: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    return mesh;
};

// Utility function to set axis tilt
const configureAxialTilt = (mesh, planetName) => {
    const group = new THREE.Group();
    group.add(mesh);
    
    const data = planetData[planetName];
    
    // Set the axis tilt and direction
    const axialTilt = THREE.MathUtils.degToRad(data.inc);
    const axialDir = THREE.MathUtils.degToRad(data.dir);
    group.rotation.z = -axialTilt;
    group.rotation.x = axialDir;
    
    // Set the initial rotation angle
    const now = new Date();
    const secondsSinceMidnight = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() - 3600 * data.hoursLapse;
    const rotationAngle = (secondsSinceMidnight / (data.day * 3600)) * 2 * Math.PI;
    mesh.rotation.y = rotationAngle;
    
    return group;
};

// Create a planet function mapping table to create corresponding planets according to the planet name
const planetCreators = {
    'mercury': createMercury,
    'venus': createVenus,
    'earth': createEarth,
    'mars': createMars,
    'jupiter': createJupiter,
    'saturn': createSaturn,
    'uranus': createUranus,
    'neptune': createNeptune
};

// Unified interface for creating planets
const createPlanet = (name, radius) => {
    if (planetCreators[name]) {
        return planetCreators[name](radius);
    }
    
    console.warn(`行星 ${name} 没有对应的创建函数，使用通用创建方法`);
    
    //Default general creation method
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/assets/${name}.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return configureAxialTilt(mesh, name);
};

// Create a group
const createGroup = (body) => {
    const group = new THREE.Group();
    group.add(body);
    return group;
};

// 导出所有工具函数
export { 
    getPlanetPosition, 
    createOrbit, 
    createSun, 
    createPlanet,
    createMoon,
    createUniverse, 
    createGroup 
};