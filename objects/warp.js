import * as THREE from "three";

class CameraWarpEffect {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.active = false;
        
        this.options = {
            lineCount: options.lineCount || 1000,       
            minLength: options.minLength || 800,      
            maxLength: options.maxLength || 3000,      
            minWidth: options.minWidth || 2,           
            maxWidth: options.maxWidth || 4,           
            color: options.color || 0xffffff,         
            speedFactor: options.speedFactor || 1.0,   
            spawnRadius: options.spawnRadius || 1.5    
        };
        
        // line group
        this.warpGroup = new THREE.Group();
        this.scene.add(this.warpGroup);
        this.lines = [];
        this.init();
    }
    
    init() {
        while (this.warpGroup.children.length > 0) {
            const obj = this.warpGroup.children[0];
            this.warpGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        this.lines = [];
        
        const material = new THREE.LineBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Creating Line Geometry
        for (let i = 0; i < this.options.lineCount; i++) {
            // Create a geometry for each line
            const geometry = new THREE.BufferGeometry();
            // Each line has two points: the start point and the end point
            const positions = new Float32Array(6); 
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create a line and add it to a group
            const line = new THREE.Line(geometry, material.clone());
            line.frustumCulled = false; 
            line.visible = false; 
            this.warpGroup.add(line);
            
            // sotre lines
            this.lines.push({
                line: line,
                length: this.options.minLength + Math.random() * (this.options.maxLength - this.options.minLength),
                speed: 1.0 + Math.random() * 2.0,
                position: new THREE.Vector3(),
                direction: new THREE.Vector3(0, 0, -1),
                distance: 0,
                opacity: 0.4 + Math.random() * 0.6
            });
        }
    }
    
    // Activate warp effect
    activate() {
        if (this.active) return;
        this.active = true;
        
        // Reset All Lines
        this.resetAllLines();
        
        // Show All Lines
        this.lines.forEach(info => {
            info.line.visible = true;
            // Set different transparency levels for different lines
            info.line.material.opacity = info.opacity;
        });
    }
    
    // Deactivaate warp effect
    deactivate() {
        if (!this.active) return;
        this.active = false;
        this.lines.forEach(info => {
            info.line.visible = false;
        });
    }
    resetAllLines() {
        for (let i = 0; i < this.lines.length; i++) {
            this.resetLine(this.lines[i]);
        }
    }
    resetLine(lineInfo) {
        // Generate a random point based on the camera frustum
        const theta = Math.random() * Math.PI * 2;
        
        
        const r = this.options.spawnRadius * Math.sqrt(Math.random());
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const startDist = 500 + Math.random() * 2000; 
        const startPoint = this.camera.position.clone()
            .add(direction.clone().multiplyScalar(startDist))
            .add(right.clone().multiplyScalar(x * startDist))
            .add(up.clone().multiplyScalar(y * startDist));
        
        // Line direction (towards the camera but slightly offset)
        const directionToCamera = this.camera.position.clone().sub(startPoint).normalize();
        lineInfo.position.copy(startPoint);
        lineInfo.direction.copy(directionToCamera);
        lineInfo.distance = 0;
        this.updateLineGeometry(lineInfo);
    }
    updateLineGeometry(lineInfo) {
        const posAttr = lineInfo.line.geometry.getAttribute("position");
        posAttr.setXYZ(0, lineInfo.position.x, lineInfo.position.y, lineInfo.position.z);
        const endPoint = lineInfo.position.clone().add(
            lineInfo.direction.clone().multiplyScalar(lineInfo.length)
        );
        posAttr.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
        posAttr.needsUpdate = true;
    }
    
    // update warp 
    update(delta, isActive) {
        if (isActive !== this.active) {
            isActive ? this.activate() : this.deactivate();
        }
        if (!this.active) return;
        
        //update all lines
        for (let i = 0; i < this.lines.length; i++) {
            const info = this.lines[i];
            const moveDistance = info.speed * 10000 * delta * this.options.speedFactor;
            info.position.add(info.direction.clone().multiplyScalar(moveDistance));
            info.distance += moveDistance;
            
            // If the line moves closer to the camera or beyond a certain distance, reset
            const distToCamera = info.position.distanceTo(this.camera.position);
            if (distToCamera < 100 || info.distance > 10000) {
                this.resetLine(info);
            } else {
                this.updateLineGeometry(info);
            }
        }
    }
    
    dispose() {
        this.scene.remove(this.warpGroup);
        
        this.lines.forEach(info => {
            if (info.line.geometry) {
                info.line.geometry.dispose();
            }
            if (info.line.material) {
                info.line.material.dispose();
            }
        });
        
        this.lines = [];
    }
}

export { CameraWarpEffect };