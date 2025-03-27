import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";


class Spaceship {
  constructor(scene) {
    this.scene = scene;

    // Create ship Camera
    this.shipCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000000
    );

    // spaceship group
    this.shipGroup = new THREE.Group();
    this.scene.add(this.shipGroup);

    // Keyboard control status
    this.controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      moveUp: false,
      moveDown: false,
      rotateUp: false,    // I
      rotateDown: false,  // K
      rotateLeft: false,  // J
      rotateRight: false, // L
    };

    this.speed = 2000;         // speed 
    this.rotationSpeed = 1.2;  // rotationspeed

    // load model
    this.shipObject = null;
    this.loadShipModel();

    // keyboard binding
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp   = this.onKeyUp.bind(this);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  loadShipModel() {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const modelPath = "/source/Raket.obj";    
    const materialPath = "/source/Raket.mtl"; 

    console.log("Start loading model...");
    mtlLoader.load(
      materialPath,
      (materials) => {
        console.log("Material loaded successfully, loading model...");
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
          modelPath,
          (object) => {
            console.log("Model loaded successfully");
            this.setupShipObject(object);
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + "% Loading spaceship model...");
          },
          (error) => {
            console.error("Error loading spaceship model:", error);
            this.createDefaultShip();
          }
        );
      },
      undefined,
      (error) => {
        this.createDefaultShip();
      }
    );
  }

  createDefaultShip() {
    const geometry = new THREE.ConeGeometry(20, 60, 5);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2,
    });
    const shipMesh = new THREE.Mesh(geometry, material);
    const shipLight = new THREE.PointLight(0x3366ff, 1, 100);
    shipLight.position.set(0, 0, -30);
    shipMesh.add(shipLight);
    const group = new THREE.Group();
    group.add(shipMesh);
    this.setupShipObject(group);
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
    // Initial position of the spacecraft
    this.shipGroup.position.set(0, 0, 20000);
    console.log("SpaceShip model initialization completed");
  }

  onKeyDown(e) {
    switch(e.code) {
      case "KeyW": this.controls.moveForward = true; break;
      case "KeyS": this.controls.moveBackward = true; break;
      case "KeyA": this.controls.moveLeft = true; break;
      case "KeyD": this.controls.moveRight = true; break;
      case "KeyQ": this.controls.moveUp = true; break;
      case "KeyE": this.controls.moveDown = true; break;
      case "KeyI": this.controls.rotateUp = true; break;
      case "KeyK": this.controls.rotateDown = true; break;
      case "KeyJ": this.controls.rotateLeft = true; break;
      case "KeyL": this.controls.rotateRight = true; break;
    }
  }

  onKeyUp(e) {
    switch(e.code) {
      case "KeyW": this.controls.moveForward = false; break;
      case "KeyS": this.controls.moveBackward = false; break;
      case "KeyA": this.controls.moveLeft = false; break;
      case "KeyD": this.controls.moveRight = false; break;
      case "KeyQ": this.controls.moveUp = false; break;
      case "KeyE": this.controls.moveDown = false; break;
      case "KeyI": this.controls.rotateUp = false; break;
      case "KeyK": this.controls.rotateDown = false; break;
      case "KeyJ": this.controls.rotateLeft = false; break;
      case "KeyL": this.controls.rotateRight = false; break;

      case "ShiftLeft":
      case "ShiftRight":
        this.controls.warp = false;
        break;
    }
  }

  update(delta) {
    if (!this.shipObject) return;

    this.updateRotation(delta);
    this.updateMovement(delta);
    this.updateCamera();
  }

  updateRotation(delta) {
    if (this.controls.rotateUp) {
      this.shipGroup.rotateX(-this.rotationSpeed * delta);
    }
    if (this.controls.rotateDown) {
      this.shipGroup.rotateX(this.rotationSpeed * delta);
    }
    if (this.controls.rotateLeft) {
      this.shipGroup.rotateY(this.rotationSpeed * delta);
    }
    if (this.controls.rotateRight) {
      this.shipGroup.rotateY(-this.rotationSpeed * delta);
    }
  }

  updateMovement(delta) {
    const speed = this.speed * delta;
    const velocity = new THREE.Vector3(0, 0, 0);

    const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shipGroup.quaternion);
    const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion);

    if (this.controls.moveForward) {
      velocity.add(forwardVec.multiplyScalar(speed));
    }
    if (this.controls.moveBackward) {
      const backVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion);
      velocity.add(backVec.multiplyScalar(speed));
    }
    if (this.controls.moveLeft) {
      velocity.add(rightVec.clone().multiplyScalar(-speed));
    }
    if (this.controls.moveRight) {
      velocity.add(rightVec.multiplyScalar(speed));
    }
    if (this.controls.moveUp) {
      velocity.add(upVec.multiplyScalar(speed));
    }
    if (this.controls.moveDown) {
      velocity.add(upVec.clone().multiplyScalar(-speed));
    }

    this.shipGroup.position.add(velocity);
  }

  updateCamera() {
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
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }
}

export { Spaceship };