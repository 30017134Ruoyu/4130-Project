import * as THREE from 'three';

class MeteorSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.meteors = [];
        this.active = true;
        
        // default option
        this.options = {
            count: options.count || 20,             // meteor num
            maxDistance: options.maxDistance || 200000,  // meteor bound
            minSpeed: options.minSpeed || 2000,     // min speed
            maxSpeed: options.maxSpeed || 8000,     // max speed
            minSize: options.minSize || 100,        // min size
            maxSize: options.maxSize || 300,        // max size
            color: options.color || 0xFFFFFF,       // color 
            trailLength: options.trailLength || 15, // tail length 
            frequency: options.frequency || 0.05    // The probability of generating a new meteor per frame
        };
        
        this.init();
    }
    
    init() {
        // init material
        this.meteorMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // create tail
        this.trailMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
    }
    
    // create meteor
    createMeteor() {
        // random position
        const distance = this.options.maxDistance;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        // Random direction (pointing to a random offset point in the center of the scene)
        const centerOffset = distance * 0.2; 
        const targetX = (Math.random() - 0.5) * centerOffset;
        const targetY = (Math.random() - 0.5) * centerOffset;
        const targetZ = (Math.random() - 0.5) * centerOffset;
        
        const direction = new THREE.Vector3(
            targetX - x,
            targetY - y,
            targetZ - z
        ).normalize();
        
        // speed 
        const speed = this.options.minSpeed + Math.random() * (this.options.maxSpeed - this.options.minSpeed);
        
        // random size
        const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
        
        // head of meteor
        const meteorGeometry = new THREE.SphereGeometry(size * 0.4, 8, 8);
        const meteorMesh = new THREE.Mesh(meteorGeometry, this.meteorMaterial.clone());
        meteorMesh.position.set(x, y, z);
        
        // tail 
        const trailLength = size * this.options.trailLength;
        const trailGeometry = new THREE.ConeGeometry(size * 0.3, trailLength, 8, 1, true);
        const trailMaterial = this.trailMaterial.clone();
        
        // Added better gradient effect to the trail
        const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
        
        // Adjust trail position and rotation
        trailMesh.position.copy(direction).multiplyScalar(-trailLength * 0.5).add(meteorMesh.position);
        trailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        // Add glow effects (light spots)
        const glowGeometry = new THREE.SphereGeometry(size * 0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        meteorMesh.add(glowMesh);
        
        // Create Meteor Group
        const meteorGroup = new THREE.Group();
        meteorGroup.add(meteorMesh);
        meteorGroup.add(trailMesh);
        this.scene.add(meteorGroup);
        
        // store meteor
        this.meteors.push({
            group: meteorGroup,
            position: new THREE.Vector3(x, y, z),
            direction: direction,
            speed: speed,
            size: size,
            distance: 0,  
            maxDistance: distance * 2  
        });
        
        return meteorGroup;
    }
    
    // Remove a meteor
    removeMeteor(index) {
        const meteor = this.meteors[index];
        this.scene.remove(meteor.group);
        meteor.group.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
            if (child.children && child.children.length > 0) {
                child.children.forEach(subChild => {
                    if (subChild.geometry) subChild.geometry.dispose();
                    if (subChild.material) subChild.material.dispose();
                });
            }
        });
        this.meteors.splice(index, 1);
    }
    
    // update all meteor
    update(delta) {
        if (!this.active) return;
        if (Math.random() < this.options.frequency && this.meteors.length < this.options.count) {
            this.createMeteor();
        }
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            const moveDistance = meteor.speed * delta;
            meteor.position.add(meteor.direction.clone().multiplyScalar(moveDistance));
            meteor.group.position.copy(meteor.position);
            
            // Update the distance moved
            meteor.distance += moveDistance;
            
            // If the meteor has moved beyond the maximum distance, remove it
            if (meteor.distance > meteor.maxDistance) {
                this.removeMeteor(i);
            }
        }
    }
    toggle() {
        this.active = !this.active;
        return this.active;
    }
    
    // Clear all meteors and resources
    dispose() {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            this.removeMeteor(i);
        }
        if (this.meteorMaterial) this.meteorMaterial.dispose();
        if (this.trailMaterial) this.trailMaterial.dispose();
    }
}

export { MeteorSystem };