import * as THREE from 'three';

class MeteorSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.meteors = [];
        this.active = true;
        
        // Keep the same options structure as the original interface
        this.options = {
            count: options.count || 20,             // number of meteors
            maxDistance: options.maxDistance || 200000,  // meteor boundary
            minSpeed: options.minSpeed || 2000,     // minimum speed
            maxSpeed: options.maxSpeed || 8000,     // maximum speed
            minSize: options.minSize || 100,        // minimum size
            maxSize: options.maxSize || 300,        // maximum size
            color: options.color || 0xFFFFFF,       // color
            trailLength: options.trailLength || 15, // tail length
            frequency: options.frequency || 0.05    // probability of generating a new meteor per frame
        };
        
        this.init();
    }
    
    init() {
        this.meteorMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.8
        });
        
        this.trailMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.4
        });
    }
    
    // Create meteor
    createMeteor() {
        // Random position (using spherical coordinates)
        const distance = this.options.maxDistance;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        // Simplified direction calculation - always pointing toward scene center
        const direction = new THREE.Vector3(-x, -y, -z).normalize();
        
        // Random speed
        const speed = this.options.minSpeed + Math.random() * (this.options.maxSpeed - this.options.minSpeed);
        
        // Random size
        const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
        
        // Create meteor group
        const meteorGroup = new THREE.Group();
        meteorGroup.position.set(x, y, z);
        
        // Meteor head - using sphere geometry
        const meteorGeometry = new THREE.SphereGeometry(size * 0.4, 8, 8);
        const meteorMesh = new THREE.Mesh(meteorGeometry, this.meteorMaterial.clone());
        
        // Meteor tail - using cone geometry, ensuring connection with head
        const trailLength = size * this.options.trailLength * 0.5;
        const trailGeometry = new THREE.ConeGeometry(size * 0.3, trailLength, 8, 1, true);
        const trailMaterial = this.trailMaterial.clone();
        const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
        
       
        // Place head at origin
        meteorMesh.position.set(0, 0, 0);
        
        
        // Calculate connection point: head radius + half of tail length
        const headRadius = size * 0.4;
        const connectionPoint = headRadius + trailLength * 0.5;
        trailMesh.position.copy(direction.clone().multiplyScalar(-connectionPoint));
        
        // Set tail rotation so cone points opposite to movement direction
        trailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
        meteorGroup.add(meteorMesh);
        meteorGroup.add(trailMesh);
        this.scene.add(meteorGroup);
        
        // Store meteor data
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
        
        // Simplified resource disposal
        meteor.group.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        
        this.meteors.splice(index, 1);
    }
    
    // Update all meteors
    update(delta) {
        if (!this.active) return;
        
        // Create new meteors based on frequency
        if (Math.random() < this.options.frequency && this.meteors.length < this.options.count) {
            this.createMeteor();
        }
        
        // Update all existing meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            const moveDistance = meteor.speed * delta;
            
            // Update position
            meteor.position.add(meteor.direction.clone().multiplyScalar(moveDistance));
            meteor.group.position.copy(meteor.position);
            
            // Update traveled distance
            meteor.distance += moveDistance;
            
            // If meteor has traveled beyond max distance, remove it
            if (meteor.distance > meteor.maxDistance) {
                this.removeMeteor(i);
            }
        }
    }

    toggle() {
        this.active = !this.active;
        return this.active;
    }
    
    // Clean up all meteors and resources
    dispose() {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            this.removeMeteor(i);
        }
        
        if (this.meteorMaterial) this.meteorMaterial.dispose();
        if (this.trailMaterial) this.trailMaterial.dispose();
    }
}

export { MeteorSystem };