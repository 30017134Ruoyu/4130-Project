// warp.js
import * as THREE from "three";

class WarpEffectSystem {
    constructor(scene, count = 1000) { // 增加线条数
        this.scene = scene;
        this.particleCount = count;
        this.active = false;

        this.linesGroup = new THREE.Group();
        scene.add(this.linesGroup);

        this.lines = [];
        this.init();
    }

    init() {
        while (this.linesGroup.children.length > 0) {
            this.linesGroup.remove(this.linesGroup.children[0]);
        }
        this.lines = [];

        const material = new THREE.LineBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        for (let i = 0; i < this.particleCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const line = new THREE.Line(geometry, material.clone());
            line.visible = false;
            this.linesGroup.add(line);

            this.lines.push({
                line,
                length: 300 + Math.random() * 300,
                offset: new THREE.Vector3()
            });
        }
    }

    activate(shipPosition, shipDirection) {
        if (this.active) return;
        this.active = true;
        this.resetLines(shipPosition, shipDirection);
        this.lines.forEach(info => info.line.visible = true);
        console.log("Warp effect ACTIVATED");
    }

    deactivate() {
        if (!this.active) return;
        this.active = false;
        this.lines.forEach(info => info.line.visible = false);
        console.log("Warp effect DEACTIVATED");
    }

    resetLines(shipPos, shipDir) {
        const forward = shipDir.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, up).normalize();

        if (Math.abs(forward.dot(up)) > 0.9) {
            up.set(1, 0, 0);
            right.crossVectors(forward, up).normalize();
        }
        up.crossVectors(right, forward).normalize();

        this.lines.forEach(info => {
            const radius = Math.random() * 1000;
            const angle = Math.random() * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = -2000 - Math.random() * 2000;

            info.offset.set(x, y, z);

            const pos = shipPos.clone()
                .addScaledVector(right, x)
                .addScaledVector(up, y)
                .addScaledVector(forward, z);

            this.updateLinePosition(info, pos, forward);
        });
    }

    updateLinePosition(info, basePos, forward) {
        const posAttr = info.line.geometry.getAttribute("position");
        posAttr.setXYZ(0, basePos.x, basePos.y, basePos.z);
        const end = basePos.clone().addScaledVector(forward, info.length);
        posAttr.setXYZ(1, end.x, end.y, end.z);
        posAttr.needsUpdate = true;
    }

    update(delta, shipPos, shipDir, isActive) {
        if (isActive !== this.active) {
            isActive ? this.activate(shipPos, shipDir) : this.deactivate();
        }
        if (!this.active) return;

        const forward = shipDir.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, up).normalize();

        if (Math.abs(forward.dot(up)) > 0.9) {
            up.set(1, 0, 0);
            right.crossVectors(forward, up).normalize();
        }
        up.crossVectors(right, forward).normalize();

        this.lines.forEach(info => {
            info.offset.z += 2500 * delta; // 线条接近飞船

            if (info.offset.z > 0) {
                info.offset.z = -2000 - Math.random() * 2000;
                info.offset.x = (Math.random() - 0.5) * 2000;
                info.offset.y = (Math.random() - 0.5) * 2000;
            }

            const pos = shipPos.clone()
                .addScaledVector(right, info.offset.x)
                .addScaledVector(up, info.offset.y)
                .addScaledVector(forward, info.offset.z);

            this.updateLinePosition(info, pos, forward);
        });
    }

    dispose() {
        this.scene.remove(this.linesGroup);
        this.lines.forEach(info => {
            info.line.geometry.dispose();
            info.line.material.dispose();
        });
    }
}

export { WarpEffectSystem };
