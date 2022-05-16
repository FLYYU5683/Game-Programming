import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import {scene,texture} from './Init.js';
var T = 2;
var clock = new THREE.Clock();
var ts = clock.getElapsedTime();
function clamp(a,b,c){
	{return Math.max(b,Math.min(c,a));}
}
class Steve {
	constructor(WW,HH){
		this.WW = WW;
		this.HH = HH;
		this.vel = new THREE.Vector3(0.0001,0,0)
		this.force = new THREE.Vector3(0,0,0);
		this.power = 0.1; 
		this.angle = 0;
		
		this.pose = {
			lThigh: -Math.PI * this.vel.length() / 120,
			rThigh: Math.PI * this.vel.length() / 120
		}
		this.pose1 = {
			lThigh: Math.PI * this.vel.length() / 120,
			rThigh: -Math.PI * this.vel.length() / 120
		}
		
		this.keys = [[0,this.pose],[0.5,this.pose1],[1,this.pose]]
		
		this.MAXSPEED = 40;
		this.ARRIVAL_R = 10;
		this.nbhd = [];
	}
	buildSteve(){
		
		this.body = this.buildBody(1.5*this.HH);
		this.head = this.buildHead(0.5*this.HH+this.WW);
		
		this.Lhand = this.buildArms(1.5*this.WW,0);
		this.Rhand = this.buildArms(-1.5*this.WW,0);
		
		this.Lleg = this.buildLegs(0.5*this.WW,-this.HH);
		this.Rleg = this.buildLegs(-0.5*this.WW,-this.HH);

		this.body.add(this.head,this.Lhand,this.Rhand,this.Lleg,this.Rleg);
		scene.add(this.body);
		this.body.position.set(100,20,0)
	}
	update(dt,target) {
		this.findNbhd(target)
		this.setTarget(target.group)
		this.accumulateForce();
		this.vel.add(this.force.clone().multiplyScalar(dt));
		this.body.lookAt(this.body.position.clone().add(this.vel));
		
		if (this.target) {
			let diff = this.target.clone().sub(this.body.position)
			let dst = diff.length();
			if (dst < this.ARRIVAL_R) {
				this.vel.setLength(dst)
			}
		}
		
		this.vel.setLength(clamp(this.vel.length(), 0, this.MAXSPEED))
		this.body.position.add(this.vel.clone().multiplyScalar(dt))
		/*
		if (this.vel.length() > 0.1) {
			this.angle = Math.atan2 (-this.vel.z, this.vel.x);
			this.body.rotation.y = -this.angle;
		}
		*/

		this.pose.lThigh = -Math.PI * this.vel.length() / 120;
		this.pose.rThigh = Math.PI * this.vel.length() / 120;
		this.pose1.lThigh = Math.PI * this.vel.length() / 120;
		this.pose1.rThigh = -Math.PI * this.vel.length() / 120;
		
		let intKey = this.keyframe(clock.getElapsedTime());
		this.Lleg.rotation.x = intKey[1];
		this.Rleg.rotation.x = intKey[0];
		this.Rhand.rotation.x = intKey[1];
		this.Lhand.rotation.x = intKey[0];
		
	}
	setTarget(target) {

		if (this.target !== undefined){
			this.target.copy(target.localToWorld(new THREE.Vector3(-40,16,80)));
		}
		else{
			var temp = new THREE.Vector3(0,0,0);
			temp.copy(target.localToWorld(new THREE.Vector3(-40,16,80)))
			this.target = new THREE.Vector3(temp.x,temp.y,temp.z);
		}
	}
	targetInducedForce(targetPos) { 
		return targetPos.clone().sub(this.body.position).normalize().multiplyScalar(this.MAXSPEED).sub(this.vel)
	}
	distanceTo(otherAgent) {
		return this.body.position.distanceTo(otherAgent.position)
	}
	addNbr(otherAgent) {
		this.nbhd.push(otherAgent)
	}
	accumulateForce() {
		if (this.target)
			this.force.copy(this.targetInducedForce(this.target));
		let push = new THREE.Vector3()
		for (let i = 0; i < this.nbhd.length; i++) {
			let point = this.body.position.clone().sub(this.nbhd[i].localToWorld(new THREE.Vector3(0,16,30)));
			push.add(point.setLength(4800 / point.length()))
		}
		this.force.add(push)
	}
	keyframe(t) {
		var s = ((t - ts) % T) / T;

		for (var i = 1; i < this.keys.length; i++) {
		if (this.keys[i][0] > s) break;
		}
		// take i-1
		var ii = i - 1;
		var a = (s - this.keys[ii][0]) / (this.keys[ii + 1][0] - this.keys[ii][0]);
		  
		let intKey = [this.keys[ii][1].lThigh * (1 - a) + this.keys[ii + 1][1].lThigh * a,
				  this.keys[ii][1].rThigh * (1 - a) + this.keys[ii + 1][1].rThigh * a];
		return intKey;
	}
	findNbhd(agents) {
		let dst;
		this.nbhd = []; 
		if(this.Check_Intersect(agents.Rect,this.body,12)){
			this.addNbr(agents.group)
			console.log("true")
		}
	}
	Check_Intersect(Rect, C, Rad) {
		const Rad2 = Rad * Rad;
	  
		let xHat = Rect.px;
		let zHat = xHat.clone().cross (new THREE.Vector3(0,1,0)).normalize();
	  
		let R = {max:{x:0, z:0}, min:{x:0, z:0}};
		let cp = Rect.max.clone().sub (C.position);   
		R.max.x = cp.dot (xHat), R.max.z = cp.dot (zHat);
	  
		cp = Rect.min.clone().sub (C.position);
		R.min.x = cp.dot (xHat), R.min.z = cp.dot (zHat);
	  
		if (R.max.x < 0) 			/* R to left of circle center */
		if (R.max.z < 0) 		/* R in lower left corner */
				return ((R.max.x * R.max.x + R.max.z * R.max.z) < Rad2);
		else if (R.min.z > 0) 	/* R in upper left corner */
				return ((R.max.x * R.max.x + R.min.z * R.min.z) < Rad2);
		else 					/* R due West of circle */
				return(Math.abs(R.max.x) < Rad);
		else if (R.min.x > 0)  	/* R to right of circle center */
			if (R.max.z < 0) 	/* R in lower right corner */
					return ((R.min.x * R.min.x + R.max.z * R.max.z) < Rad2);
		else if (R.min.z > 0)  	/* R in upper right corner */
				return ((R.min.x * R.min.x + R.min.z * R.min.z) < Rad2);
		else 				/* R due East of circle */
				return (R.min.x < Rad);
		else				/* R on circle vertical centerline */
			if (R.max.z < 0) 	/* R due South of circle */
				return (Math.abs(R.max.z) < Rad);
		else if (R.min.z > 0)  	/* R due North of circle */
				return (R.min.z < Rad);
		else 				/* R contains circle centerpoint */
				return(true);
	}
	buildHead(y){
		var head = new THREE.Group();
		var geometry = new THREE.BufferGeometry();	
		var vertices = [];
		var indices = [];
		var uvs = [];
		
		
		const ww = 1;
		const hh = 3;
		const UU = 14*ww;
		const VV = hh + 5*ww;
		const WW = this.WW*2, HH = this.WW*2,DD = this.WW*2;
		
		var a = {u: 2*ww, v: hh+5*ww};
		var b = {u: 4*ww, v: hh+5*ww};
		var c = {u: 6*ww, v: hh+5*ww};
		var d = {u: 0, v: hh+3*ww};
		var e = {u: 2*ww, v: hh+3*ww};
		var f = {u: 4*ww, v: hh+3*ww};
		var g = {u: 6*ww, v: hh+3*ww};
		var h = {u: 8*ww, v: hh+3*ww};
		var i = {u: 0, v: hh+ww};
		var j = {u: 2*ww, v: hh+ww};
		var k = {u: 4*ww, v: hh+ww};
		var l = {u: 6*ww, v: hh+ww};
		var m = {u: 8*ww, v: hh+ww};
		
		vertices.push(WW/2,HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,-HH/2,-DD/2, WW/2,HH/2,-DD/2 );
		indices.push(0,1,2, 0,2,3);
		uvs.push (f.u/UU,f.v/VV, k.u/UU,k.v/VV, l.u/UU,l.v/VV, g.u/UU,g.v/VV);
		
		vertices.push(WW/2,HH/2,-DD/2, WW/2,-HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(4,5,6, 4,6,7);
		uvs.push (g.u/UU,g.v/VV, l.u/UU,l.v/VV, m.u/UU,m.v/VV, h.u/UU,h.v/VV);
		
		vertices.push(-WW/2,HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,-HH/2,DD/2, -WW/2,HH/2,DD/2 );
		indices.push(8,9,10, 8,10,11);
		uvs.push (d.u/UU,d.v/VV, i.u/UU,i.v/VV, j.u/UU,j.v/VV, e.u/UU,e.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, -WW/2,-HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,HH/2,DD/2 );
		indices.push(12,13,14, 12,14,15);
		uvs.push (e.u/UU,e.v/VV, j.u/UU,j.v/VV, k.u/UU,k.v/VV, f.u/UU,f.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, WW/2,HH/2,DD/2, WW/2,HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(16,17,18, 16,18,19);
		uvs.push (a.u/UU,a.v/VV, e.u/UU,e.v/VV, f.u/UU,f.v/VV, b.u/UU,b.v/VV);	
		
		vertices.push(WW/2,-HH/2,DD/2, -WW/2,-HH/2,DD/2, -WW/2,-HH/2,-DD/2, WW/2,-HH/2,-DD/2 );
		indices.push(20,21,22, 20,22,23);
		uvs.push (b.u/UU,b.v/VV, f.u/UU,f.v/VV, g.u/UU,g.v/VV, c.u/UU,c.v/VV);
		
		geometry.setIndex(indices);  
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));	
		var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
		var mesh = new THREE.Mesh(geometry,material);
		head.add(mesh);
		head.position.y = y;
		
		return head;
	}
	buildArms(x,y){
		let Arms = new THREE.Group();
		var geometry = new THREE.BufferGeometry();	
		var vertices = [];
		var indices = [];
		var uvs = [];
		
		const ww = 1;
		const hh = 3;
		const UU = 14*ww;
		const VV = hh + 5*ww;
		const WW = this.WW, HH = this.HH,DD = this.WW;
			
		var a = {u: 11*ww, v: hh+ww};
		var b = {u: 12*ww, v: hh+ww};
		var c = {u: 13*ww, v: hh+ww};
		var d = {u: 10*ww, v: hh};
		var e = {u: 11*ww, v: hh};
		var f = {u: 12*ww, v: hh};
		var g = {u: 13*ww, v: hh};
		var h = {u: 14*ww, v: hh};
		var i = {u: 10*ww, v: 0};
		var j = {u: 11*ww, v: 0};
		var k = {u: 12*ww, v: 0};
		var l = {u: 13*ww, v: 0};
		var m = {u: 14*ww, v: 0};

		
		vertices.push(WW/2,HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,-HH/2,-DD/2, WW/2,HH/2,-DD/2 );
		indices.push(0,1,2, 0,2,3);
		uvs.push (f.u/UU,f.v/VV, k.u/UU,k.v/VV, l.u/UU,l.v/VV, g.u/UU,g.v/VV);

		vertices.push(WW/2,HH/2,-DD/2, WW/2,-HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(4,5,6, 4,6,7);
		uvs.push (g.u/UU,g.v/VV, l.u/UU,l.v/VV, m.u/UU,m.v/VV, h.u/UU,h.v/VV);
		
		vertices.push(-WW/2,HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,-HH/2,DD/2, -WW/2,HH/2,DD/2 );
		indices.push(8,9,10, 8,10,11);
		uvs.push (d.u/UU,d.v/VV, i.u/UU,i.v/VV, j.u/UU,j.v/VV, e.u/UU,e.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, -WW/2,-HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,HH/2,DD/2 );
		indices.push(12,13,14, 12,14,15);
		uvs.push (e.u/UU,e.v/VV, j.u/UU,j.v/VV, k.u/UU,k.v/VV, f.u/UU,f.v/VV);
		vertices.push(-WW/2,HH/2,DD/2, WW/2,HH/2,DD/2, WW/2,HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(16,17,18, 16,18,19);
		uvs.push (a.u/UU,a.v/VV, e.u/UU,e.v/VV, f.u/UU,f.v/VV, b.u/UU,b.v/VV);	
		
		vertices.push(WW/2,-HH/2,DD/2, -WW/2,-HH/2,DD/2, -WW/2,-HH/2,-DD/2, WW/2,-HH/2,-DD/2 );
		indices.push(20,21,22, 20,22,23);
		uvs.push (b.u/UU,b.v/VV, f.u/UU,f.v/VV, g.u/UU,g.v/VV, c.u/UU,c.v/VV);

		geometry.setIndex(indices);  
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));	
		var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
		var mesh = new THREE.Mesh(geometry,material);
		mesh.position.y = -0.5*HH;
		Arms.add(mesh);
		Arms.position.set(x,y + 0.5*HH,0);
		
		return Arms;
	}
	buildLegs(x,y){
		let Legs = new THREE.Group();
			var geometry = new THREE.BufferGeometry();	
		var vertices = [];
		var indices = [];
		var uvs = [];
		
		
		
		const ww = 1;
		const hh = 3;
		const UU = 14*ww;
		const VV = hh + 5*ww;
		const WW = this.WW, HH = this.HH,DD = this.WW;
			
		var a = {u: 1*ww, v: hh+ww};
		var b = {u: 2*ww, v: hh+ww};
		var c = {u: 3*ww, v: hh+ww};
		var d = {u: 0*ww, v: hh};
		var e = {u: 1*ww, v: hh};
		var f = {u: 2*ww, v: hh};
		var g = {u: 3*ww, v: hh};
		var h = {u: 4*ww, v: hh};
		var i = {u: 0*ww, v: 0};
		var j = {u: 1*ww, v: 0};
		var k = {u: 2*ww, v: 0};
		var l = {u: 3*ww, v: 0};
		var m = {u: 4*ww, v: 0};
		
		vertices.push(WW/2,HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,-HH/2,-DD/2, WW/2,HH/2,-DD/2 );
		indices.push(0,1,2, 0,2,3);
		uvs.push (f.u/UU,f.v/VV, k.u/UU,k.v/VV, l.u/UU,l.v/VV, g.u/UU,g.v/VV);
		
		vertices.push(WW/2,HH/2,-DD/2, WW/2,-HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(4,5,6, 4,6,7);
		uvs.push (g.u/UU,g.v/VV, l.u/UU,l.v/VV, m.u/UU,m.v/VV, h.u/UU,h.v/VV);
		
		vertices.push(-WW/2,HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,-HH/2,DD/2, -WW/2,HH/2,DD/2 );
		indices.push(8,9,10, 8,10,11);
		uvs.push (d.u/UU,d.v/VV, i.u/UU,i.v/VV, j.u/UU,j.v/VV, e.u/UU,e.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, -WW/2,-HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,HH/2,DD/2 );
		indices.push(12,13,14, 12,14,15);
		uvs.push (e.u/UU,e.v/VV, j.u/UU,j.v/VV, k.u/UU,k.v/VV, f.u/UU,f.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, WW/2,HH/2,DD/2, WW/2,HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(16,17,18, 16,18,19);
		uvs.push (a.u/UU,a.v/VV, e.u/UU,e.v/VV, f.u/UU,f.v/VV, b.u/UU,b.v/VV);	
		
		vertices.push(WW/2,-HH/2,DD/2, -WW/2,-HH/2,DD/2, -WW/2,-HH/2,-DD/2, WW/2,-HH/2,-DD/2 );
		indices.push(20,21,22, 20,22,23);
		uvs.push (b.u/UU,b.v/VV, f.u/UU,f.v/VV, g.u/UU,g.v/VV, c.u/UU,c.v/VV);	
		
		geometry.setIndex(indices);  
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));	
		var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
		var mesh = new THREE.Mesh(geometry,material);
		mesh.position.y = -0.5*HH;
		Legs.add(mesh);
		Legs.position.set(x,y + 0.5*HH,0);
		
		return Legs;
	}
	buildBody(y){
		var body = new THREE.Group();
		
		var geometry = new THREE.BufferGeometry();	
		
		var vertices = [];
		var indices = [];
		var uvs = [];
		
		
		const ww = 1;
		const hh = 3;
		const UU = 14*ww;
		const VV = hh + 5*ww;
		const WW = this.WW*2, HH = this.HH,DD = this.WW;
		
		var a = {u: 5*ww, v: hh+ww};
		var b = {u: 7*ww, v: hh+ww};
		var c = {u: 9*ww, v: hh+ww};
		var d = {u: 4*ww, v: hh};
		var e = {u: 5*ww, v: hh};
		var f = {u: 7*ww, v: hh};
		var g = {u: 8*ww, v: hh};
		var h = {u: 10*ww, v: hh};
		var i = {u: 4*ww, v: 0};
		var j = {u: 5*ww, v: 0};
		var k = {u: 7*ww, v: 0};
		var l = {u: 8*ww, v: 0};
		var m = {u: 10*ww, v: 0};
		var x = {u: 9*ww, v: hh};
		
		
		vertices.push(WW/2,HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,-HH/2,-DD/2, WW/2,HH/2,-DD/2 );
		indices.push(0,1,2, 0,2,3);
		uvs.push (f.u/UU,f.v/VV, k.u/UU,k.v/VV, l.u/UU,l.v/VV, g.u/UU,g.v/VV);

		
		vertices.push(WW/2,HH/2,-DD/2, WW/2,-HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(4,5,6, 4,6,7);
		uvs.push (g.u/UU,g.v/VV, l.u/UU,l.v/VV, m.u/UU,m.v/VV, h.u/UU,h.v/VV);
		
		vertices.push(-WW/2,HH/2,-DD/2, -WW/2,-HH/2,-DD/2, -WW/2,-HH/2,DD/2, -WW/2,HH/2,DD/2 );
		indices.push(8,9,10, 8,10,11);
		uvs.push (d.u/UU,d.v/VV, i.u/UU,i.v/VV, j.u/UU,j.v/VV, e.u/UU,e.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, -WW/2,-HH/2,DD/2, WW/2,-HH/2,DD/2, WW/2,HH/2,DD/2 );
		indices.push(12,13,14, 12,14,15);
		uvs.push (e.u/UU,e.v/VV, j.u/UU,j.v/VV, k.u/UU,k.v/VV, f.u/UU,f.v/VV);
		
		vertices.push(-WW/2,HH/2,DD/2, WW/2,HH/2,DD/2, WW/2,HH/2,-DD/2, -WW/2,HH/2,-DD/2 );
		indices.push(16,17,18, 16,18,19);
		uvs.push (a.u/UU,a.v/VV, e.u/UU,e.v/VV, f.u/UU,f.v/VV, b.u/UU,b.v/VV);	
		
		vertices.push(WW/2,-HH/2,DD/2, -WW/2,-HH/2,DD/2, -WW/2,-HH/2,-DD/2, WW/2,-HH/2,-DD/2 );
		indices.push(20,21,22, 20,22,23);
		uvs.push (b.u/UU,b.v/VV, f.u/UU,f.v/VV, x.u/UU,x.v/VV, c.u/UU,c.v/VV);
		
		
		
		geometry.setIndex(indices);  
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));	
		var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
		var mesh = new THREE.Mesh(geometry,material);
		body.add(mesh);
		body.position.y = y;
		
		return body;
	}
	
}
export{Steve}