var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var video;

//variables for the animated orb
var abstract;
var morph = [];

// variables for the torus knot
var torus;

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
	var element = document.body;
	var pointerlockchange = function (event) {
		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
			controlsEnabled = true;
			controls.enabled = true;
			blocker.style.display = 'none';
		} else {
			controls.enabled = false;
			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';
			instructions.style.display = '';
		}
	};

	var pointerlockerror = function (event) {
		instructions.style.display = '';
	};

	// Hook pointer lock state change events
	document.addEventListener('pointerlockchange', pointerlockchange, false);
	document.addEventListener('mozpointerlockchange', pointerlockchange, false);
	document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

	document.addEventListener('pointerlockerror', pointerlockerror, false);
	document.addEventListener('mozpointerlockerror', pointerlockerror, false);
	document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

	instructions.addEventListener('click', function(event) {
		instructions.style.display = 'none';
		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			if ( /Firefox/i.test(navigator.userAgent)) {
				var fullscreenchange = function (event) {
					if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
						document.removeEventListener('fullscreenchange', fullscreenchange);
						document.removeEventListener('mozfullscreenchange', fullscreenchange);
						element.requestPointerLock();
					}
				};

				document.addEventListener('fullscreenchange', fullscreenchange, false);
				document.addEventListener('mozfullscreenchange', fullscreenchange, false);
				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
				element.requestFullscreen();
			} else {
				element.requestPointerLock();
			}
	}, false );

} else {
	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

init();
rooms_setup();
animate();


function init() {
	var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

	scene = new THREE.Scene();
	scene.fog= new THREE.FogExp2(new THREE.Color("#000000"), 0.00015); //new THREE.Color("#87CEEB")


	camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 100000);
	camera.position.set(-100, 300, 0);
	
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled= true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild(renderer.domElement);

	var loader= new THREE.OBJLoader();
	var material = new THREE.MeshBasicMaterial({color: 'yellow'});

	window.addEventListener('resize', onWindowResize, false);

	var onKeyDown = function (event) {
		switch (event.keyCode) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;
		}
	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	};

	var onEKey = function(event){
		switch(event.keyCode){
			case 69: video.play();
		}
	}

	var onPause = function(event){
		switch(event.keyCode){
			case 80:video.pause();
					video.currentTime = 0;
		}
	}

	// event listeners for keyboard controls
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
	document.addEventListener('keydown',onEKey, false); 
	document.addEventListener('keydown', onPause, false);

}

function onWindowResize() {
	var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();

	renderer.setSize(WIDTH, HEIGHT);
}

function animate() {
	requestAnimationFrame( animate );
	if (controlsEnabled) {
		var time = performance.now();
		var delta = (time - prevTime) / 1000;

		velocity.x -= velocity.x * 1.0 * delta;
		velocity.z -= velocity.z * 1.0 * delta;

		if (moveForward) velocity.z -= 400.0 * delta;
		if (moveBackward) velocity.z += 400.0 * delta;

		if (moveLeft) velocity.x -= 400.0 * delta;
		if (moveRight) velocity.x += 400.0 * delta;

		controls.getObject().translateX(velocity.x * delta);
		controls.getObject().translateZ(velocity.z * delta);

		prevTime = time;
	}

	animate_abstract();
	torus_gradient();

	// update the video frames
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageCtx.drawImage( video, 0, 0 );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}

	renderer.render(scene, camera);
}

//#####################################################################################################################################################

/*
*	Function to control all lighting effects in the scene
*/
function lights_setup(){

	// set up basic lights 
	var light = new THREE.SpotLight(0xffffff, 0.6);
	light.position.set(-1000, 500, 0);
	
	// target of the light to point at
	light.target.position.set(-1000, 0, 0);
	scene.add(light.target);

	light.castShadow = true;

	light.shadowMapWidth = light.shadowMapHeight = 2048;
	light.angle = -60;
	var d = 4000;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

	light.shadowCameraFar  = 3000;
	light.shadowDarkness = 1;

	scene.add(light);

	// spot light 2 - kitchen area
	var spotlight2 = new THREE.SpotLight(0xffffff, 0.3);
	spotlight2.position.set(-1200, 500, -1200);
	spotlight2.angle = -60;
	
	// target of the spotlight2 to point at
	spotlight2.target.position.set(-1200, 0, -1200);
	scene.add(spotlight2.target);

	spotlight2.angle = 10;
	scene.add(spotlight2);

	// directional light 1
	var dir_light = new THREE.DirectionalLight(0xffffff, 0.7);
	
	dir_light.castShadow = true;
	dir_light.position.set(-500, 500, 0);

	// target of the light to point at
	dir_light.target.position.set(-1500, 0, -1500);
	scene.add(dir_light.target);

	dir_light.shadowMapWidth = dir_light.shadowMapHeight = 2048;
	dir_light.angle = 60;
	var d = 2000;

    dir_light.shadowCameraLeft = -d;
    dir_light.shadowCameraRight = d;
    dir_light.shadowCameraTop = d;
    dir_light.shadowCameraBottom = -d;

	dir_light.shadowCameraFar  = 3000;
	dir_light.shadowDarkness = 1;
	scene.add(dir_light);

	// directional light 2
	var dir_light_2 = new THREE.DirectionalLight(0xffffff, 0.7);
	
	dir_light_2.castShadow = true;
	dir_light_2.position.set(0, 500, 0);

	// target of the light to point at
	dir_light_2.target.position.set(1500, 0, 1500);
	scene.add(dir_light_2.target);

	dir_light_2.shadowMapWidth = dir_light_2.shadowMapHeight = 2048;
	dir_light_2.angle = 60;
	var d = 2000;

    dir_light_2.shadowCameraLeft = -d;
    dir_light_2.shadowCameraRight = d;
    dir_light_2.shadowCameraTop = d;
    dir_light_2.shadowCameraBottom = -d;

	dir_light_2.shadowCameraFar  = 3000;
	dir_light_2.shadowDarkness = 1;
	scene.add(dir_light_2);

	// ambient light
	var ambient_light= new THREE.AmbientLight(new THREE.Color("#a8ccd7"), 0.2);
	scene.add(ambient_light);
}


/* 
*	This function creates the floor of the house 
*/
function floor_setup(){
	// geometry
	var geometry = new THREE.BoxGeometry(4000, 4000, 10);

	// texture and material
	var floor_texture = THREE.ImageUtils.loadTexture('img/floor_texture.jpg');
	floor_texture.wrapS = THREE.RepeatWrapping;
	floor_texture.wrapT = THREE.RepeatWrapping;
	floor_texture.repeat.set(8, 8);

	var floor_bump = THREE.ImageUtils.loadTexture('img/floor_bump.jpg');
	floor_bump.wrapS = THREE.RepeatWrapping;
	floor_bump.wrapT = THREE.RepeatWrapping;
	floor_bump.repeat.set(8, 8);

	var material = new THREE.MeshPhongMaterial({shading: THREE.SmoothShading});
	material.map = floor_texture;
	material.bumpMap = floor_bump;
	material.bumpScale = 1.5;
	
	var plane = new THREE.Mesh(geometry, material);

	// set the rotation so it lays flat
	plane.rotation.set(-90 * (3.13/180), 0, 0);

    // add the floor to the scene
	scene.add(plane);

	// set shadow properties
	plane.castShadow = true;
    plane.receiveShadow = true;
}

/*
*	Function to setup the concrete floor on the balcony
*/
function balcony_setup(){
	var geo = new THREE.PlaneGeometry(2000, 2450);

	// material with texture and bump map
	var floor_texture = THREE.ImageUtils.loadTexture('img/concrete_texture.jpg');
	floor_texture.wrapS = THREE.RepeatWrapping;
	floor_texture.wrapT = THREE.RepeatWrapping;
	floor_texture.repeat.set(32, 32);

	var floor_bump = THREE.ImageUtils.loadTexture('img/concrete_bump.jpg');
	floor_bump.wrapS = THREE.RepeatWrapping;
	floor_bump.wrapT = THREE.RepeatWrapping;
	floor_bump.repeat.set(32, 32);

	var material = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	material.map = floor_texture;
	material.bumpMap = floor_bump;
	material.bumpScale = 1.5;
	
	var floor = new THREE.Mesh(geo, material);
	scene.add(floor);
	floor.rotation.set(-90*(3.13/180), 0, 0);
	floor.position.set(1000, 10, -770);
	floor.receiveShadow = true;

}

/*
*	Setup the ceiling
*/
function ceiling_setup(){
	
	// texture for the ceiling (reusing the texture used for walls)
	var ceiling_texture = THREE.ImageUtils.loadTexture('img/ceiling_texture.jpg');
	ceiling_texture.wrapS = THREE.RepeatWrapping;
	ceiling_texture.wrapT = THREE.RepeatWrapping;
	ceiling_texture.repeat.set(4, 4);

	// material
	var material = new THREE.MeshPhongMaterial({map: ceiling_texture, shading: THREE.SmoothShading});

	// first part of the ceiling
	// geometry
	var geometry_1 = new THREE.BoxGeometry(1990, 4000, 30);
	// mesh
	var ceiling_1 = new THREE.Mesh(geometry_1, material);
	scene.add(ceiling_1);
	ceiling_1.position.set(-970, 605, 0);
	ceiling_1.rotation.set(-90*(3.13/180), 0, 0);
	ceiling_1.castShadow = true; 

	// second part of the ceiling,
	// geometry
	var geometry_2 = new THREE.CubeGeometry(2140, 1540, 30);
	// mesh
	var ceiling_2 = new THREE.Mesh(geometry_2, material);
	scene.add(ceiling_2);
	ceiling_2.position.set(950, 600, 1175);
	ceiling_2.rotation.set(-90*(3.13/180), 0, 0);
	ceiling_2.castShadow = true; 
}

/*
*	Function to create main's room ceiling lights
*/
function setup_mroom_light(){
	var geo = new THREE.SphereGeometry(50, 50, 50);
	var mat = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.9,
		reflectivity: 2,
	});

	var light = new THREE.Mesh(geo, mat);
	scene.add(light);
	light.position.set(-1000, 525, 0);

	var light2= new THREE.Mesh(geo, mat);
	scene.add(light2);
	light2.position.set(-1200, 525, -1200);
}

/*
*	This function sets up all the walls in the apartment (including transparent balcony entrance and windows)
*	This is achieved by loading an .obj file created in 3DS Max and adding it to the scene at proper location
*/
function walls_setup(){
	var loader= new THREE.OBJLoader();

	// texture for the walls
	var wall_texture = THREE.ImageUtils.loadTexture('img/wall_texture.jpg');
	wall_texture.wrapS = THREE.RepeatWrapping;
	wall_texture.wrapT = THREE.RepeatWrapping;
	wall_texture.repeat.set(8, 8);

	var material = new THREE.MeshPhongMaterial({map: wall_texture, shading: THREE.SmoothShading, reflectivity:0.5});

	loader.load('obj/walls.obj', function(object){

		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = material;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(0,0,0);
		object.scale.set(50, 30, 50);
	});
}

/*
*	Function to setup all the elements made from glass (windows, balcony entrance and barriers)
*/
function glass_setup(){
	var glass_m = new THREE.MeshLambertMaterial({
		color: new THREE.Color("#a8ccd7"),
		opacity: 0.3,
		transparent: true
	});

	// WINDOW
	var window_geo = new THREE.CubeGeometry(10, 700, 2000);
	var window = new THREE.Mesh(window_geo, glass_m);
	scene.add(window);
	window.position.set(0, 200, -750);
	window.receiveShadow = true;

	// BALCONY ENTRANCE
	// glass
	var entrance_geo = new THREE.CubeGeometry(750, 1150, 10);
	var entrance = new THREE.Mesh(entrance_geo, glass_m);
	scene.add(entrance);
	entrance.position.set(500, 0, 450);
	// frame
	var frame_mat = new THREE.MeshLambertMaterial({color: new THREE.Color("#000000")});   // material is reused for all frame elements
	// vertical part
	var frame_ver_geo = new THREE.CylinderGeometry(7, 7, 1150);
	var frame_vert = new THREE.Mesh(frame_ver_geo, frame_mat);
	scene.add(frame_vert);
	frame_vert.castShadow = true;
	frame_vert.position.set(875, 0, 450);
	// horizontal part
	var frame_hor_geo = new THREE.CylinderGeometry(7, 20, 1700);
	var frame_hor = new THREE.Mesh(frame_hor_geo, frame_mat);
	scene.add(frame_hor);
	frame_hor.position.set(975, 0, 450);
	frame_hor.rotation.set(-90*(3.13/180), 0 ,-90*(3.13/180));

	// BARRIERS
	// longer
	var long_geo = new THREE.CubeGeometry(10, 200, 2470);
	var long_b = new THREE.Mesh(long_geo, glass_m);
	scene.add(long_b);
	long_b.position.set(2000, 100, -770);

	// shorter
	var short_geo = new THREE.CubeGeometry(2000, 200, 10);
	var short_b = new THREE.Mesh(short_geo, glass_m);
	scene.add(short_b);
	short_b.position.set(1000, 100, -2000);
}

/*
*	Setup basic bedroom furniture
*/
function bedroom_setup(){
	// BACKSIDE 
	var backside_geo = new THREE.CubeGeometry(50, 350, 1000);
	// material with texture and bump map
	var dwood_texture = THREE.ImageUtils.loadTexture('img/dark_wood_texture.jpg');
	dwood_texture.wrapS = THREE.RepeatWrapping;
	dwood_texture.wrapT = THREE.RepeatWrapping;
	dwood_texture.repeat.set(2, 2);

	var dwood_bump = THREE.ImageUtils.loadTexture('img/dark_wood_bump.png');
	dwood_bump.wrapS = THREE.RepeatWrapping;
	dwood_bump.wrapT = THREE.RepeatWrapping;
	dwood_bump.repeat.set(2, 2);

	var dwood_mat = new THREE.MeshPhongMaterial({shading: THREE.SmoothShading});
	dwood_mat.map = dwood_texture;
	dwood_mat.bumpMap = dwood_bump;
	dwood_mat.bumpScale = 1.5;

	var backside = new THREE.Mesh(backside_geo, dwood_mat);
	scene.add(backside);
	backside.castShadow = true; backside.receiveShadow = true;
	backside.position.set(1900, 0, 1250);

	// FRAME
	var frame_geo = new THREE.CubeGeometry(1200, 100, 900);
	var frame = new THREE.Mesh(frame_geo, dwood_mat);
	scene.add(frame);
	frame.castShadow = true; frame.receiveShadow = true;
	frame.position.set(1500, 0, 1250);

	// MATERACE
	// materace material with texture
	var cloth_texture = THREE.ImageUtils.loadTexture('img/cloth_texture.jpg');
	cloth_texture.wrapS = THREE.RepeatWrapping;
	cloth_texture.wrapT = THREE.RepeatWrapping;
	cloth_texture.repeat.set(4, 4);

	var materace_mat = new THREE.MeshLambertMaterial();
	materace_mat.map = cloth_texture;

	// materace geometry
	var loader= new THREE.OBJLoader();
	loader.load('obj/materace.obj', function(object){
		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = materace_mat;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(1475, 50, 1325);
		object.scale.set(2.5, 1, 1.75);
	});

}

/*
*	Create basic main kitchen furniture
*/
function kitchen_furniture_setup(){
	// BAR AREA
	// bottom
	var bar_geo = new THREE.BoxGeometry(1000, 200, 100);
	var bar_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#D3D3D3')});
	var bar = new THREE.Mesh(bar_geo, bar_mat);
	scene.add(bar);
	bar.position.set(-1500, 100, -1200);
	bar.castShadow = true, bar.receiveShadow = true;
	// counter
	var counter_geo = new THREE.BoxGeometry(1150, 20, 250);
	//reused darkwood material
	var dwood_texture = THREE.ImageUtils.loadTexture('img/dark_wood_texture.jpg');
	dwood_texture.wrapS = THREE.RepeatWrapping;
	dwood_texture.wrapT = THREE.RepeatWrapping;
	dwood_texture.repeat.set(2, 2);

	var dwood_bump = THREE.ImageUtils.loadTexture('img/dark_wood_bump.png');
	dwood_bump.wrapS = THREE.RepeatWrapping;
	dwood_bump.wrapT = THREE.RepeatWrapping;
	dwood_bump.repeat.set(2, 2);

	var dwood_mat = new THREE.MeshPhongMaterial({shading: THREE.SmoothShading});
	dwood_mat.map = dwood_texture;
	dwood_mat.bumpMap = dwood_bump;
	dwood_mat.bumpScale = 1.5;

	var counter = new THREE.Mesh(counter_geo, dwood_mat);
	scene.add(counter);
	counter.position.set(-1450, 210, -1200);
	counter.castShadow = true;//, counter.receiveShadow = true;

	// CUPBOARDS AND SCND COUNTER
	// bottom cupboards
	var base_geo = new THREE.BoxGeometry(1000, 200, 200);
	var base_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#D3D3D3')});
	var base = new THREE.Mesh(base_geo, base_mat);
	scene.add(base);
	base.castShadow=true; base.receiveShadow = true;
	base.position.set(-1500, 100, -1850);
	// counter 2
	var counter_2_geo = new THREE.CubeGeometry(1000, 20, 220);
	var counter = new THREE.Mesh(counter_2_geo, dwood_mat);
	scene.add(counter);
	counter.position.set(-1500, 210, -1850);
	counter.castShadow = true; counter.receiveShadow = true;

	// upper cupboards
	var cupboards = [];
	var handles = [];
	// geometry for the cupboard
	var cupb_geo = new THREE.CubeGeometry(300, 250, 100);
	// geometry for the handles
	var handle_geo = new THREE.CubeGeometry(10, 40, 10);
	var handle_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#000000')});
	
	// array of cupboards meshes together with handles
	for(var i = 0; i < 3; i++){
		var cupboard = new THREE.Mesh(cupb_geo, base_mat);
		cupboard.position.set(-1800+(i*325), 500, -1900);
		cupboards.push(cupboard);
		scene.add(cupboard);

		var handle = new THREE.Mesh(handle_geo, handle_mat);
		handle.position.set(-1660+(i*325), 400, -1845);
		handles.push(handle);
		scene.add(handle);
	}

	// MUG
	var mug_mat = new THREE.MeshPhongMaterial({
		color: new THREE.Color('#F5F5DC'),
		shading : THREE.SmoothShading
	});
	var loader= new THREE.OBJLoader();
	loader.load('obj/mug.obj', function(object){
		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = mug_mat;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(-1150, 220, -1200);
		object.rotation.set(-90*(3.13/180), 0, 35*(3.13/180));
		object.scale.set(0.4, 0.4, 0.4);
	});
}

/*
*	Create bar stools
*/
function bar_stools_setup(){
	// material
	var silver_mat = new THREE.MeshPhongMaterial({
		color: new THREE.Color('#c0c0c0'),
		reflectivity: 2
	});
	
	// leather material with texture and bump map
	var leather_texture = THREE.ImageUtils.loadTexture('img/leather_texture.jpg');
	leather_texture.wrapS = THREE.RepeatWrapping;
	leather_texture.wrapT = THREE.RepeatWrapping;
	leather_texture.repeat.set(2, 2);

	var leather_bump = THREE.ImageUtils.loadTexture('img/leather_bump.png');
	leather_bump.wrapS = THREE.RepeatWrapping;
	leather_bump.wrapT = THREE.RepeatWrapping;
	leather_bump.repeat.set(2, 2);

	var leather_mat = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	leather_mat.map = leather_texture;
	leather_mat.bumpMap = leather_bump;
	leather_mat.bumpScale = 1.5;

	// base geometry
	var base_geo = new THREE.CylinderGeometry(20, 50, 20, 64);
	// leg geometry
	var leg_geo = new THREE.CylinderGeometry(10, 10, 150, 64);
	// seat geoemtry
	var seat_geo = new THREE.CylinderGeometry(70, 60, 40, 8, 8);
	var modifier = new THREE.BufferSubdivisionModifier(1);
	seat_geo = modifier.modify(seat_geo);

	// create the stools by using a parent object and adding elements as children
	var stools = [];

	for (var i = 0; i < 2; i++){
		var stool = new THREE.Object3D();

		var base = new THREE.Mesh(base_geo, silver_mat);
		var leg = new THREE.Mesh(leg_geo, silver_mat);
		var seat = new THREE.Mesh(seat_geo, leather_mat);

		base.castShadow = true; base.receiveShadow = true;
		leg.castShadow = true; leg.receiveShadow = true;
		seat.castShadow = true; seat.receiveShadow = true;

		base.position.y -= 60;
		leg.position.y -= 0;
		seat.position.y += 80;

		stool.add(base);
		stool.add(leg);
		stool.add(seat);

		scene.add(stool);
		stool.position.set(-1650+(i*350), 85, -1000);

		stools.push(stool);
	}
}

/*
*	Create the center furniture in the room
*/
function center_furniture_setup(){
	// TABLE
	var table_parent = new THREE.Object3D();
	// top
	// material with texture and bump
	var dwood_texture = THREE.ImageUtils.loadTexture('img/dark_wood_texture.jpg');
	dwood_texture.wrapS = THREE.RepeatWrapping;
	dwood_texture.wrapT = THREE.RepeatWrapping;
	dwood_texture.repeat.set(2, 2);

	var dwood_bump = THREE.ImageUtils.loadTexture('img/dark_wood_bump.png');
	dwood_bump.wrapS = THREE.RepeatWrapping;
	dwood_bump.wrapT = THREE.RepeatWrapping;
	dwood_bump.repeat.set(2, 2);

	var table_mat = new THREE.MeshPhongMaterial({shading: THREE.SmoothShading});
	table_mat.map = dwood_texture;
	table_mat.bumpMap = dwood_bump;
	table_mat.bumpScale = 1.5;

	var table_geo = new THREE.CubeGeometry(400, 10, 800);
	var table = new THREE.Mesh(table_geo, table_mat);
	table.receiveShadow = true; table.castShadow = true;
	
	table_parent.add(table);
	// legs
	var legs = [];
	var leg_geo = new THREE.CubeGeometry(375, 100, 10);
	// create two table legs
	for(var i=0; i<2; i++){
		var leg = new THREE.Mesh(leg_geo, table_mat);
		table_parent.add(leg);
		leg.position.y -= 50;
		leg.receiveShadow = true;
		leg.castShadow = true;
		legs.push(leg);
	}
	scene.add(table_parent);
	legs[0].position.z = -200;
	legs[1].position.z = 200;
	table_parent.position.set(-1000, 100, 0);
	table_parent.receiveShadow = true;

	// COUCH
	var couch_element_g = new THREE.CubeGeometry(200, 50, 400, 8, 8);
	couch_element_g.mergeVertices();
	var modifier = new THREE.BufferSubdivisionModifier(2);
	smooth_geometry = modifier.modify(couch_element_g);

	var leather_texture = THREE.ImageUtils.loadTexture('img/leather_texture.jpg');
	leather_texture.wrapS = THREE.RepeatWrapping;
	leather_texture.wrapT = THREE.RepeatWrapping;
	leather_texture.repeat.set(2, 2);

	var leather_bump = THREE.ImageUtils.loadTexture('img/leather_bump.png');
	leather_bump.wrapS = THREE.RepeatWrapping;
	leather_bump.wrapT = THREE.RepeatWrapping;
	leather_bump.repeat.set(2, 2);

	var leather_mat = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	leather_mat.map = leather_texture;
	leather_mat.bumpMap = leather_bump;
	leather_mat.bumpScale = 1.5;

	var couch_parent = new THREE.Object3D();
	var couch_elements = [];

	for(var i = 0; i<4; i++){
		var couch = new THREE.Mesh(smooth_geometry, leather_mat);
		couch.receiveShadow = true; 
		couch.castShadow = true;

		couch_elements.push(couch);
		couch_parent.add(couch);
	}

	// set the position of couch elements
	couch_elements[0].position.set(125, 0, -205);
	couch_elements[1].position.set(125, 0, 205);
	couch_elements[2].position.set(0, 75, -205);
	couch_elements[3].position.set(0, 75, 205);

	// scale two bottom pillows
	couch_elements[0].scale.set(1.25, 1, 1);
	couch_elements[1].scale.set(1.25, 1, 1);
	
	// set the rotation of two pillows
	couch_elements[2].rotation.set(0, 0 , -75*(3.13/180));
	couch_elements[3].rotation.set(0, 0 , -75*(3.13/180));

	couch_parent.position.set(-1750, 50, 0);
	scene.add(couch_parent);

	// WARDROBE
	// parent object
	var wardrobe = new THREE.Object3D();
	// geometry 
	var wardrobe_geo = new THREE.CubeGeometry(500, 500, 200);

	// texture with bump map
	var wood_texture = THREE.ImageUtils.loadTexture('img/wood_texture_2.jpg');
	wood_texture.wrapS = THREE.RepeatWrapping;
	wood_texture.wrapT = THREE.RepeatWrapping;
	wood_texture.repeat.set(1, 2);

	var wood_bump = THREE.ImageUtils.loadTexture('img/wood_bump_2.png');
	wood_bump.wrapS = THREE.RepeatWrapping;
	wood_bump.wrapT = THREE.RepeatWrapping;
	wood_bump.repeat.set(1, 2);

	var wood_mat = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	wood_mat.map = wood_texture;
	wood_mat.bumpMap = wood_bump;
	wood_mat.bumpScale = 1.5;

	// simple material for wood painted white
	var mat = new THREE.MeshLambertMaterial();

	var wardrobe_main = new THREE.Mesh(wardrobe_geo, mat);
	scene.add(wardrobe_main);
	wardrobe_main.receiveShadow = true; wardrobe.castShadow = true;
	wardrobe.add(wardrobe_main);

	// wardrobe doors
	doors = [];
	var doors_geo = new THREE.CubeGeometry(240, 480, 10);
	for(var i=0; i<2; i++){
		var door = new THREE.Mesh(doors_geo, wood_mat);
		door.receiveShadow = true; door.castShadow = true;
		doors.push(door);
		wardrobe.add(door);
		scene.add(door);
	}

	doors[0].position.set(-180, 250, 1750);
	doors[1].position.set(-425, 250, 1750);

	// door handles
	handles = [];
	// geometry for the handles
	var handle_geo = new THREE.CubeGeometry(10, 40, 10);
	var handle_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#000000')});
	for(var i=0; i<2; i++){
		var handle = new THREE.Mesh(handle_geo, handle_mat);
		handle.castShadow = true;
		wardrobe.add(handle);
		handles.push(handle);
		scene.add(handle);
	}

	handles[0].position.set(-325, 260, 1740);
	handles[1].position.set(-285, 260, 1740);
	
	wardrobe.position.set(-300, 250, 1850);
	scene.add(wardrobe);

	// DRAWERS
	var drawers_parent = new THREE.Object3D();
	// geometry
	var drawers_geo = new THREE.CubeGeometry(800, 300, 200);

	// reuse materials from the wardrobe for this one

	var drawer_main = new THREE.Mesh(drawers_geo, mat);
	drawer_main.castShadow = true; drawer_main.receiveShadow = true;
	drawers_parent.add(drawer_main);

	// front 
	var front_elements = [];
	// geometry
	var front_geo = new THREE.CubeGeometry(90, 795, 10);
	for(var i=0; i<3;i++){
		var front = new THREE.Mesh(front_geo, wood_mat);
		front.receiveShadow = true; front.castShadow = true;
		drawers_parent.add(front);
		scene.add(front);
		front_elements.push(front);
		front.rotation.set(0, 0, 90*(3.13/180));
	}

	front_elements[0].position.set(-1000, 45, 1750);
	front_elements[1].position.set(-1000, 145, 1750);
	front_elements[2].position.set(-1000, 245, 1750);

	drawer_main.position.set(-1000, 150, 1850);
	scene.add(drawer_main);

	// CARPET
	var carpet_geo = new THREE.CubeGeometry(800, 5, 1200);
	// texture with bump map
	var carpet_texture = THREE.ImageUtils.loadTexture('img/carpet_texture.png');
	carpet_texture.wrapS = THREE.RepeatWrapping;
	carpet_texture.wrapT = THREE.RepeatWrapping;
	carpet_texture.repeat.set(4, 4);


	var carpet_bump = THREE.ImageUtils.loadTexture('img/carpet_bump.png');
	carpet_bump.wrapS = THREE.RepeatWrapping;
	carpet_bump.wrapT = THREE.RepeatWrapping;
	carpet_bump.repeat.set(4, 4);

	var carpet_mat = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	carpet_mat.map = carpet_texture;
	carpet_mat.bumpMap = carpet_bump;
	carpet_mat.bumpScale = 1.5;

	var carpet = new THREE.Mesh(carpet_geo, carpet_mat);
	scene.add(carpet);
	carpet.receiveShadow = true;
	//carpet.rotation.set(0, 0, 90*(3.13/180));
	carpet.position.set(-1000, 7, 0);

	// TROPHY
	var trophy_mat = new THREE.MeshPhongMaterial({
		color: new THREE.Color('#ffff00'),
		specular : new THREE.Color('#ffff00'),
		reflectivity: 2,
		shininess: 100,
		shading: THREE.SmoothShading
	});

	var loader= new THREE.OBJLoader();
	loader.load('obj/trophycup.obj', function(object){
		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = trophy_mat;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(-650, 300, 1825);
		object.rotation.set(-90*(3.13/180), 0, 35*(3.13/180));
		object.scale.set(1, 1, 1);
	});

	// FLOWER POT
	var pot_mat = new THREE.MeshPhongMaterial({
		shading: THREE.SmoothShading,
		color: new THREE.Color('#964514')
	});

	var pot_loader= new THREE.OBJLoader();
	loader.load('obj/cuptwisted.obj', function(object){
		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = pot_mat;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(-1300, 300, 1885);
		object.rotation.set(-90*(3.13/180), 0, 35*(3.13/180));
		object.scale.set(1, 1, 1);
	});

}

/*
*	Function to create the doors - simple cube geometry with a very strong bump map
*/
function doors_setup(){
	var door_geo = new THREE.CubeGeometry(10, 540, 300);

	// material with a bump map
	var door_texture = THREE.ImageUtils.loadTexture('img/door_texture.jpg');
	door_texture.wrapS = THREE.RepeatWrapping;
	door_texture.wrapT = THREE.RepeatWrapping;
	door_texture.repeat.set(1, 1);

	var door_bump = THREE.ImageUtils.loadTexture('img/door_bump.png');
	door_bump.wrapS = THREE.RepeatWrapping;
	door_bump.wrapT = THREE.RepeatWrapping;
	door_bump.repeat.set(1, 1);

	var door_mat = new THREE.MeshLambertMaterial({shading: THREE.SmoothShading});
	door_mat.map = door_texture;
	door_mat.bumpMap = door_bump;
	door_mat.bumpScale = 2;

	var door = new THREE.Mesh(door_geo, door_mat);
	scene.add(door);

	door.receiveShadow = true;
	door.castShadow = true;
	door.position.set(-1945, 270, 1450);
}

/*
*	Create the lamp in the bedroom
*/
function bedroom_lamp_setup(){
	// base geometry
	var base_geo = new THREE.CylinderGeometry(20, 50, 20, 64);
	// leg geometry
	var leg_geo = new THREE.CylinderGeometry(10, 10, 300, 64);
	// seat geoemtry
	var top_geo = new THREE.CylinderGeometry(40, 70, 120, 64, 64);
	
	// materials
	var silver_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#c0c0c0')});
	var top_mat = new THREE.MeshPhongMaterial({color:new THREE.Color('#000000')});

	// parent object
	var lamp = new THREE.Object3D();
	// meshes
	var base = new THREE.Mesh(base_geo, silver_mat);
	var leg = new THREE.Mesh(leg_geo, silver_mat);
	var top = new THREE.Mesh(top_geo, top_mat);
	// add them to the lamp parent object
	lamp.add(base);
	lamp.add(leg);
	lamp.add(top);
	// shadow properties
	base.castShadow = true; base.receiveShadow= true;
	leg.castShadow = true; leg.receiveShadow = true;
	top.castShadow = true; top.receiveShadow = true;
	// adjust positions
	base.position.y += 20;
	leg.position.y += 150;
	top.position.y += 330;
	// move the lamp
	lamp.position.set(1875, 0, 675);
	scene.add(lamp);
}

/*
*	Function to create posters on the walls
*/
function posters_setup(){
	var poster_geo = new THREE.CubeGeometry(899, 1600, 20);
	var poster_mat = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('img/mucha_poster.jpg')});
	var poster = new THREE.Mesh(poster_geo, poster_mat);
	poster.receiveShadow = true;
	
	poster.scale.set(0.2, 0.2, 0.2);
	poster.position.set(-1945, 300, 750);
	poster.rotation.set(0, 90*(3.13/180), 0);
	scene.add(poster);

	var painting_geo = new THREE.CubeGeometry(1200, 538, 10);
	var painting_mat = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('img/klimt_painting.jpg')});
	var painting = new THREE.Mesh(painting_geo, painting_mat);
	painting.receiveShadow = true;
	//painting.scale.set(0.8, 0.8, 0.8);
	painting.position.set(1000, 280, 1950);
	scene.add(painting);
}

/*
*	Load the rocket model standing in the corner
*/
function rocket_setup(){

	// reflective material
	var rocket_mat = new THREE.MeshPhongMaterial({
		color: new THREE.Color('#c0c0c0'),
		specular: 0xffffff,
		reflectivity: 1.5,
		shininess: 100,
	});

	var loader= new THREE.OBJLoader();
	loader.load('obj/rocket.obj', function(object){
		object.traverse(function(child){
			if(child instanceof THREE.Mesh){
				child.material = rocket_mat;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(object);
		// set the scale and position
		object.position.set(-205, 0, -1725);
		object.rotation.set(-90*(3.13/180), 0, 35*(3.13/180));
		object.scale.set(4, 4, 4);
	});
}

/*
*	Setup the TV that will play a short video
* 	DISCLAIMER:
*	Code adapted from https://stemkoski.github.io/Three.js/Video.html, credit to Stemkoski
*	I'm using this example to implement user interaction into the scene, not to present knowledge about 
*	displaying videos in the scene as I'm basing it on the code provided.
*/
function video_setup(){
	// create an html body element
	// (videos are rendered on html5 canvas)
	video = document.createElement('video');
	video.src = "vid/nyan.mp4";
	video.load();
	//video.play();

	videoImage = document.createElement('canvas');
	videoImage.width = 540;
	videoImage.height = 360;
	
	// background color if no video present
	videoImageCtx = videoImage.getContext('2d');
	videoImageCtx.fillStyle = '#ff0000';
	videoImageCtx.fillRect( 0, 0, videoImage.width, videoImage.height );

	// create the texture and material used to display the  video
	videoTexture = new THREE.Texture(videoImage);
	// filters needed to resize the video so that it fits on to the chosen mesh
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	var movie_mat = new THREE.MeshBasicMaterial({
		map: videoTexture,
		overdraw: true,
		side: THREE.DoubleSide
	});

	// create the geometry
	var movie_geo = new THREE.PlaneGeometry(540, 360, 4, 4);
	var screen = new THREE.Mesh(movie_geo, movie_mat);
	screen.position.set(-37, 335, 570);
	screen.rotation.set(0, 90*(3.13/180), 0);
	scene.add(screen);

	// TV frame material and geometry
	var frame_geo = new THREE.CubeGeometry(580, 385, 10);
	var frame_mat = new THREE.MeshPhongMaterial({color: new THREE.Color('#000000'), shading: THREE.FlatShading});
	var frame = new THREE.Mesh(frame_geo, frame_mat);
	frame.castShadow = true;
	frame.rotation.set(0, 90*(3.13/180), 0);
	frame.position.set(-30, 335, 570);
	scene.add(frame);
}



/*
*	Create a rotating abstract shape
*/
function setup_abstract(){
	var geometry = new THREE.SphereGeometry(40, 8, 8);
	
	var mat = new THREE.MeshPhongMaterial({
		color: new THREE.Color('#000000'),
		specular: new THREE.Color('#58585B'),
		shading: THREE.FlatShading,
		wireframe: false
	});
	

	geometry.mergeVertices();
	var l = geometry.vertices.length;

	for (var i = 0; i < l; i++){
		var v = geometry.vertices[i];
		morph.push({
			y : v.y,
			x : v.x,
			z : v.z, 
			ang : Math.random() * Math.PI * 2,
			amp : 3 + Math.random() * 2,
			speed : 0.016 + Math.random() * 0.032
		});
	}

	abstract = new THREE.Mesh(geometry, mat);
	abstract.castShadow = true;
	abstract.position.set(-1000, 200,0);
	scene.add(abstract);
}

/*
*	Function to animate the abstract shape - vertices are moved at random, shape is changing
*	(This function is to show that I understand how vertices work in threejs)
*/
function animate_abstract(){
	var array= [64];
	var verts = abstract.geometry.vertices;
	var l = verts.length;
	var step = Math.round(array.length / 32);

	abstract.rotation.x += 0.005;
	abstract.rotation.y += 0.005;

	for (var i = 0; i < l; i++){
		var v = verts[i];
		var vprops = morph[i];
		var value = array[i * step] / 18 * Math.cos(vprops.ang) * Math.sin(vprops.ang);
		
		v.x = vprops.x + value * vprops.amp;//Math.cos(vprops.ang) * vprops.amp + value;
		v.y = vprops.y + value * vprops.amp;//Math.sin(vprops.ang) * vprops.amp + value;
		v.z = vprops.z + value * vprops.amp;//* vprops.amp;

		abstract.geometry.scale.z = value;

		// increment angle for next frame
		vprops.ang += vprops.speed;
	}
	abstract.geometry.verticesNeedUpdate = true;
}

/*
*	Function to create a gradient coloured torus knot to display skills connected to colors and vertices
*/
function torus_setup(){
	var geometry = new THREE.TorusKnotGeometry(200, 100, 64, 16);

	var mat = new THREE.MeshPhongMaterial({
		vertexColors:THREE.VertexColors,
		shading: THREE.FlatShading
	});

	torus = new THREE.Mesh(geometry, mat);
	scene.add(torus);
	torus.position.set(1500, 450, -1500);
}

/*
*	Change the colours of torus vertices randomly 
*	Colors are assigned only once - changing them each frame would be too resource taxing
*	This function is called during the render loop to allow for object rotation 
*   (I chose to use only two colors in order to achieve a better effect, it could be expanded to more)
*/
function torus_gradient(){

	// array of colors
	colors = [];
	colors.push(new THREE.Color('#ff0000')); // red
	/*
	colors.push(new THREE.Color('#00ff00')); // green
	colors.push(new THREE.Color('#0000ff')); // blue
	colors.push(new THREE.Color('#ffff00')); // yellow
	colors.push(new THREE.Color('#000000')); // black 
	*/
	colors.push(new THREE.Color('#ffffff')); // white
		
	torus.rotation.x += 0.0005;
	torus.rotation.y -= 0.0005;

	for (var i = 0; i < torus.geometry.vertices.length*2; i++){
		// random colours 
		color_no_1 = Math.round(Math.random()*2);
		color_no_2 = Math.round(Math.random()*2);
		color_no_3 = Math.round(Math.random()*2);
		// assign colors to given faces vertices
		torus.geometry.faces[i].vertexColors = [colors[color_no_1], colors[color_no_2], colors[color_no_3]];
	}
}


/*
*	This function creates a skybox from a set of 6 images
*/
function skybox_setup(){
	// array of images
	var images = ["img/posx.jpg", "img/negx.jpg", "img/posy.jpg", "img/negy.jpg", "img/posz.jpg", "img/negz.jpg"];

	// assign the images to materials in an array
	// materials have side specified to BackSide so that the cube is "inverted" and images are on the inside
	var material_array= [];
	for(var i=0; i<6; i++){
		material_array.push(new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture(images[i]),
			side: THREE.BackSide
		}));
	}
	var skybox_material = new THREE.MeshFaceMaterial(material_array);

	skybox_geometry = new THREE.CubeGeometry(15000, 15000, 15000);

	skybox_mesh = new THREE.Mesh(skybox_geometry, skybox_material);
	scene.add(skybox_mesh);
}

function rooms_setup(){
	lights_setup();
	floor_setup();
	balcony_setup();
	ceiling_setup();
	setup_mroom_light()
	walls_setup();
	glass_setup();
	bedroom_setup();
	bedroom_lamp_setup();
	kitchen_furniture_setup();
	center_furniture_setup();
	posters_setup();
	doors_setup();
	rocket_setup();
	setup_abstract();
	torus_setup();
	video_setup();
	bar_stools_setup();
	skybox_setup();
}