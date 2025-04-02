import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { planetData } from "./objects/data.js";
import { getPlanetPosition, createOrbit, createSun, createPlanet, createGroup } from "./objects/utils.js";
import { createBackground } from "./objects/background.js";
import { Spaceship } from "./objects/spaceship.js";
import { PlanetInfoSystem } from "./objects/planet-info.js";


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);


const globalCamera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  10000000
);
globalCamera.position.set(0, 5000, 15000);
globalCamera.lookAt(scene.position);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(globalCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 100;
controls.maxDistance = 5000000;


const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 500000;
scene.add(sunLight);


const background = createBackground(scene);


const sun = createSun(planetData.sun.name, planetData.sun.radius);
sun.scale.set(50, 50, 50);
scene.add(sun);


const planetNames = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
const sizeScale = {
  sun: 50,
  mercury: 200,
  venus: 200,
  earth: 200,
  mars: 200,
  jupiter: 150,
  saturn: 100,
  uranus: 70,
  neptune: 80,
};
const orbitSpeedFactor = 10000;
const orbitPeriods = {
  mercury: 88,
  venus: 225,
  earth: 365,
  mars: 687,
  jupiter: 4333,
  saturn: 10759,
  uranus: 30687,
  neptune: 60190,
};

const planets = {};
const planetGroups = {};
const orbits = {};

planetNames.forEach((name) => {

  const orbit = createOrbit(name);
  scene.add(orbit);
  orbits[name] = orbit;


  const planet = createPlanet(name, planetData[name].radius);
  planet.scale.set(sizeScale[name], sizeScale[name], sizeScale[name]);

 
  const planetGroup = createGroup(planet);
  scene.add(planetGroup);

 
  const initialPosition = getPlanetPosition(name, Date.now());
  planetGroup.position.copy(initialPosition);

  planets[name] = planet;
  planetGroups[name] = planetGroup;
});

// Spaceship (with separate camera and warp effect)
const spaceship = new Spaceship(scene);

background.initCameras(spaceship.getActiveCamera(), globalCamera);
const planetInfoSystem = new PlanetInfoSystem(scene, planetGroups, planetData);


// dat.gui 
const gui = new dat.GUI();
const cameraOptions = {
  mode: "God View", // "Spaceship" or "God View"
  selectedPlanet: "none", // Select the planet to focus on ("none" means no focus)
  showOrbits: true,
  reset: () => { 
    globalCamera.position.set(0, 5000, 15000);
    controls.target.set(0, 0, 0);
  },
};

controls.enabled = true;

// Switch camera mode
gui.add(cameraOptions, "mode", ["Spaceship", "God View"]).name("Camera Mode").onChange((value) => {
  controls.enabled = (value === "God View");
});

gui.add(cameraOptions, "showOrbits").name("Show Orbits").onChange((value) => {
  planetNames.forEach((name) => {
    orbits[name].visible = value;
  });
});

planetNames.forEach((name) => {
  orbits[name].visible = cameraOptions.showOrbits;
});

// Planet selection list (added "none" option)
const planetList = ["none", ...planetNames];
gui.add(cameraOptions, "selectedPlanet", planetList).name("Focus Planet").onChange((value) => {
  if (value !== "none") {
    const pos = planetGroups[value].position.clone();
    // Calculate an offset based on the planetary position (adjustable as needed)
    const offset = new THREE.Vector3(
      pos.x > 0 ? -2000 : 2000,
      1000,
      pos.z > 0 ? -2000 : 2000
    );
    globalCamera.position.copy(pos).add(offset);
    controls.target.copy(pos);
  }
});

// Reset God's Perspective
gui.add(cameraOptions, "reset").name("Reset God View");
const infoFolder = gui.addFolder("Planet Info demonstrate:");
infoFolder.add({ showPlanetInfo: true }, 'showPlanetInfo')
  .name("Display information while approaching a planet")
  .onChange(value => {
    if (!value && planetInfoSystem.infoCardState.isOpen) {
      planetInfoSystem.hideInfoCard();
    }
    planetInfoSystem.proximityThreshold = value ? 10000 : 0;
  });

// label
planetNames.forEach((name) => {
  const label = document.createElement("div");
  label.className = "planet-label";
  label.dataset.name = name;
  label.textContent = name;
  label.style.position = "absolute";
  label.style.color = "#" + planetData[name].color.toString(16).padStart(6, "0");
  label.style.fontWeight = "bold";
  label.style.fontSize = "14px";
  label.style.textShadow = "0 0 3px black";
  label.style.pointerEvents = "none";
  label.style.display = "none";
  document.body.appendChild(label);
});

window.addEventListener("resize", () => {
  globalCamera.aspect = window.innerWidth / window.innerHeight;
  globalCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const shipCam = spaceship.getActiveCamera();
  shipCam.aspect = window.innerWidth / window.innerHeight;
  shipCam.updateProjectionMatrix();
});

let time = Date.now();
let orbitAngles = {};
planetNames.forEach((name) => {
  orbitAngles[name] = 0;
});

// Update planet label positions
function updatePlanetLabels() {
  
  const currentCamera = cameraOptions.mode === "Spaceship" ? spaceship.getActiveCamera() : globalCamera;
  
  planetNames.forEach((name) => {
    const label = document.querySelector(`.planet-label[data-name="${name}"]`);
    if (!label) return;
    const planetGroup = planetGroups[name];

    // Set the label position to the top of the planet
    const labelOffsetFactor = 1.2;
    const planetRadius = sizeScale[name] || 100;
    const labelHeight = planetRadius * labelOffsetFactor;
    const labelWorldPos = planetGroup.position.clone().add(new THREE.Vector3(0, labelHeight, 0));

    // Use the currently active camera for projection
    const vector = labelWorldPos.clone().project(currentCamera);
    let x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    let y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    y -= 20;
    
    if (vector.z < 0 || vector.z > 1) {
      label.style.display = "none";
    } else {
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.display = "block";
    }
  });
}


let simulationTime = Date.now(); 


function animate() {
  requestAnimationFrame(animate);

  const now = Date.now();
  const delta = (now - time) / 1000; 
  time = now;
  
  
  simulationTime += delta * 1000 * orbitSpeedFactor; 

  background.animate(delta, cameraOptions.mode);
  const currentCamera = cameraOptions.mode === "Spaceship" ? 
    spaceship.getActiveCamera() : globalCamera;
  planetInfoSystem.setActiveCamera(currentCamera);

  planetInfoSystem.update();

  // sun and planet rotation
  sun.children[0].rotation.y += 0.0005;

  planetNames.forEach((name) => {
    // Calculate position using getPlanetPosition and simulation time
    const position = getPlanetPosition(name, simulationTime);
    planetGroups[name].position.copy(position);
    
    const rotationSpeed = 2 * Math.PI / (planetData[name].day * 3600);
    planets[name].children[0].rotation.y += rotationSpeed * delta * 3600;
  });

  
  spaceship.update(delta);
  updatePlanetLabels();

  controls.enabled = (cameraOptions.mode === "God View");
  if (controls.enabled) {
    controls.update();
  }
  if (cameraOptions.mode === "Spaceship") {
    renderer.render(scene, spaceship.getActiveCamera());
  } else {
    renderer.render(scene, globalCamera);
  }
}


animate();

window.addEventListener("beforeunload", () => {
  background.cleanup && background.cleanup();
  spaceship.dispose();
  planetInfoSystem.dispose(); 
});


