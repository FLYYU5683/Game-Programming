import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';
import {readModel,obj} from './Model.js';
import {Agent} from './Agent.js';
import {Steve} from './Steve.js';
var scene, camera, renderer;
var texture;
var steve,agent;
var raycaster;
var pickables = [];
var puck;
var clock = new THREE.Clock();
var isMade = false;
var mouse = new THREE.Vector2();
function init(){
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x888888);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize , false);
	
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 10000);
	let controls = new OrbitControls(camera, renderer.domElement);
	camera.position.z = 300;
	camera.position.y = 200;
	camera.lookAt(new THREE.Vector3(0,0,0))
	
	
	var ambientLight = new THREE.AmbientLight( 0xffffff ); // soft white light
	scene.add(ambientLight);
	
	var gridXZ = new THREE.GridHelper(1000, 100, 'red', 'white');
	scene.add(gridXZ);
	
	var loader = new THREE.TextureLoader();
	loader.setCrossOrigin('');
	texture = loader.load ('https://i.imgur.com/dSQ0A9W.png');
	
	readModel('bus_setia_negara_texturizer',300);
	
	steve = new Steve(4,12);
	steve.buildSteve();
	
	puck = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 2, 20), new THREE.MeshBasicMaterial({
		color: 'yellow',
		transparent: true,
		opacity: 0.3
	}));
	scene.add(puck);
	
	raycaster = new THREE.Raycaster();
	document.addEventListener('pointerdown', onDocumentMouseDown, false);
	
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({
	/*
	transparent: true,
    opacity: 0.5,
    visible: true
	*/
	}));
	scene.add(plane);
	plane.rotation.x = -Math.PI / 2;
	pickables = [plane];	
}
function animate(){

	var dt = clock.getDelta();
	if(obj != undefined){
		if(!isMade){
			console.log("y")
			agent = new Agent(new THREE.Vector3(0,0,0),obj);
			isMade = true;
		}
			agent.update(dt);
			steve.update(dt,agent);
	}
	
	requestAnimationFrame(animate);
	render();
}

function render(){
	renderer.render(scene,camera);
}
function onWindowResize(){
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
}
function onDocumentMouseDown(event) {

  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // find intersections
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(pickables);
  if (intersects.length > 0) {
    puck.position.copy(intersects[0].point);
    agent.setTarget(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z)
  }
}
export{scene, camera,texture,init,animate}