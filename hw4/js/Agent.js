import * as THREE from 'http://cdn.skypack.dev/three@0.136';
import {scene} from './Init.js';
function clamp(a,b,c){
	{return Math.max(b,Math.min(c,a));}
}
class Agent {
	constructor(pos, obj) {
		this.obj = obj;
		this.obj.position.set(-60.5,30,20)
		this.group = new THREE.Group();
		this.group.add(this.obj)
		scene.add(this.group);
		this.pos = pos.clone();
		this.vel = new THREE.Vector3();
		this.force = new THREE.Vector3();
		this.target = null;
		this.size = 3;

		
		this.MAXSPEED = 100;
		this.ARRIVAL_R = 10;
		this.nbhd = [];
	}
	update(dt) {
		this.makeRect();
		this.accumulateForce();
		this.vel.add(this.force.clone().multiplyScalar(dt));
		this.group.lookAt(this.group.position.clone().add(this.vel));
    
		if (this.target) {
			let diff = this.target.clone().sub(this.pos)
			let dst = diff.length();
			if (dst < this.ARRIVAL_R) {
				this.vel.setLength(dst)
			}
		}
		
		this.vel.setLength(clamp(this.vel.length(), 0, this.MAXSPEED))
		this.pos.add(this.vel.clone().multiplyScalar(dt))
		
		this.group.position.copy(new THREE.Vector3(this.pos.x,this.pos.y,this.pos.z))
	}
	setTarget(x,y,z) {
		if (this.target !== null)
			this.target.set(x,y,z);
		else
			this.target = new THREE.Vector3(x,y,z);
	}
	targetInducedForce(targetPos) { 
		return targetPos.clone().sub(this.pos).normalize().multiplyScalar(this.MAXSPEED).sub(this.vel)
	}
	accumulateForce() {
		if (this.target)
			this.force.copy(this.targetInducedForce(this.target));
	}
	makeRect() {
		this.Rect = {};
		this.Rect.max = this.group.localToWorld ( new THREE.Vector3(20, 0, 140) );
		this.Rect.min = this.group.localToWorld ( new THREE.Vector3(-20, 0,-70) );
		this.Rect.px = this.group.localToWorld ( new THREE.Vector3(1,0,0)).sub (this.group.position);
	}

}
export{Agent}