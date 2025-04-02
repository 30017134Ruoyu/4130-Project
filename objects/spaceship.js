import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

class Spaceship {
  constructor(scene) {
    this.scene = scene;

    // Camera
    this.shipCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000000
    );

    // Group
    this.shipGroup = new THREE.Group();
    this.scene.add(this.shipGroup);

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;

    // Rotation state
    this.rotateLeft = false;
    this.rotateRight = false;
    this.rotateUp = false;
    this.rotateDown = false;

    this.speed = 2000;
    this.rotationSpeed = 1.2;

    this.shipObject = null;
    this.loadShipModel();

    // Bind and register input
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  loadShipModel() {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const modelPath = "/source/Raket.obj";
    const materialPath = "/source/Raket.mtl";

    mtlLoader.load(
      materialPath,
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
          modelPath,
          (object) => {
            this.setupShipObject(object);
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + "% Loading spaceship model...");
          },
          (error) => {
            console.error("Error loading spaceship model:", error);
          }
        );
      },
      undefined,
      (error) => {
        console.error("Error loading materials:", error);
      }
    );
  }

  setupShipObject(object) {
    this.shipObject = object;
    this.shipObject.scale.set(10, 10, 10);
    this.shipObject.rotation.y = Math.PI;

    this.shipObject.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.side = THREE.DoubleSide;
      }
    });

    this.shipGroup.add(this.shipObject);
    this.shipGroup.position.set(0, 0, 20000);
    console.log("Spaceship initialized");
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'KeyQ': this.moveUp = true; break;
      case 'KeyE': this.moveDown = true; break;
      case 'KeyJ': this.rotateLeft = true; break;
      case 'KeyL': this.rotateRight = true; break;
      case 'KeyI': this.rotateUp = true; break;
      case 'KeyK': this.rotateDown = true; break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'KeyQ': this.moveUp = false; break;
      case 'KeyE': this.moveDown = false; break;
      case 'KeyJ': this.rotateLeft = false; break;
      case 'KeyL': this.rotateRight = false; break;
      case 'KeyI': this.rotateUp = false; break;
      case 'KeyK': this.rotateDown = false; break;
    }
  }

  update(delta) {
    if (!this.shipObject) return;

    const rotSpeed = this.rotationSpeed * delta;

    // Apply rotation
    if (this.rotateLeft) this.shipGroup.rotateY(rotSpeed);
    if (this.rotateRight) this.shipGroup.rotateY(-rotSpeed);
    if (this.rotateUp) this.shipGroup.rotateX(-rotSpeed);
    if (this.rotateDown) this.shipGroup.rotateX(rotSpeed);

    // Direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shipGroup.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion);

    const moveSpeed = this.speed * delta;

    // Apply movement
    if (this.moveForward) this.shipGroup.position.addScaledVector(forward, moveSpeed);
    if (this.moveBackward) this.shipGroup.position.addScaledVector(forward, -moveSpeed);
    if (this.moveLeft) this.shipGroup.position.addScaledVector(right, -moveSpeed);
    if (this.moveRight) this.shipGroup.position.addScaledVector(right, moveSpeed);
    if (this.moveUp) this.shipGroup.position.addScaledVector(up, moveSpeed);
    if (this.moveDown) this.shipGroup.position.addScaledVector(up, -moveSpeed);

    // Camera follow behind the ship
    const offset = new THREE.Vector3(0, 300, 800);
    const worldOffset = offset.clone().applyQuaternion(this.shipGroup.quaternion);
    const desiredPos = this.shipGroup.position.clone().add(worldOffset);

    this.shipCamera.position.copy(desiredPos);
    this.shipCamera.lookAt(this.shipGroup.position);
    this.shipCamera.up.set(0, 1, 0);
  }

  getActiveCamera() {
    return this.shipCamera;
  }

  dispose() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  }
}

export { Spaceship };
