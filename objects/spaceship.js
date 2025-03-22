import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { WarpEffectSystem } from "./warp.js";

class Spaceship {
  constructor(scene) {
    this.scene = scene;

    // 创建飞船独立摄像机
    this.shipCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000000
    );

    // 飞船组
    this.shipGroup = new THREE.Group();
    this.scene.add(this.shipGroup);

    // 键盘控制状态
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
      warp: false         // Shift
    };

    this.speed = 2000;         // 移动速度
    this.rotationSpeed = 1.2;  // 旋转速度（弧度/秒）

    // 创建隧穿效果系统
    this.warpSystem = new WarpEffectSystem(this.scene, 50); // 只生成 50 条线条

    // 飞船模型
    this.shipObject = null;
    this.loadShipModel();

    // 绑定键盘事件
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp   = this.onKeyUp.bind(this);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  loadShipModel() {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const modelPath = "/source/Raket.obj";    // 替换为你的.obj路径
    const materialPath = "/source/Raket.mtl"; // 替换为你的.mtl路径

    console.log("开始加载飞船模型...");
    mtlLoader.load(
      materialPath,
      (materials) => {
        console.log("材质加载成功，正在加载模型...");
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
          modelPath,
          (object) => {
            console.log("模型加载成功");
            this.setupShipObject(object);
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + "% 飞船模型加载中...");
          },
          (error) => {
            console.error("加载飞船模型时出错:", error);
            this.createDefaultShip();
          }
        );
      },
      undefined,
      (error) => {
        console.error("加载飞船材质时出错:", error);
        this.createDefaultShip();
      }
    );
  }

  createDefaultShip() {
    console.warn("使用默认飞船模型");
    const geometry = new THREE.ConeGeometry(20, 60, 5);
    geometry.rotateX(Math.PI / 2); // 让尖端朝 -Z
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

    // 让模型旋转 180 度，如果你发现机头依旧朝向错误，可改成旋转 x 或 z
    this.shipObject.rotation.y = Math.PI;

    this.shipObject.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.side = THREE.DoubleSide;
      }
    });

    this.shipGroup.add(this.shipObject);
    // 飞船初始位置
    this.shipGroup.position.set(0, 0, 20000);
    console.log("飞船模型初始化完成");
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

      // Shift 键开启隧穿
      case "ShiftLeft":
      case "ShiftRight":
        if (!this.controls.warp) {
          console.log("Shift pressed, activating Warp");
        }
        this.controls.warp = true;
        break;
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

      // 松开 Shift
      case "ShiftLeft":
      case "ShiftRight":
        if (this.controls.warp) {
          console.log("Shift released, deactivating Warp");
        }
        this.controls.warp = false;
        break;
    }
  }

  update(delta) {
    if (!this.shipObject) return;

    this.updateRotation(delta);
    this.updateMovement(delta);
    this.updateCamera();

    // 计算飞船摄像机的朝向（默认前方 -Z）
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipCamera.quaternion);

    // 更新隧穿效果
    this.warpSystem.update(
        delta,
        this.shipCamera.position,
        new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipCamera.quaternion),
        this.controls.warp
      );
      
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

    // 机头 -Z
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
    // 第三人称：让摄像机固定在飞船后方(+Z)并稍微上抬
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
    this.warpSystem.dispose();
  }
}

export { Spaceship };
