import {GLTFLoader} from './lib/GLTFLoader.js';
import {FontLoader} from './lib/fontloader/FontLoader.js';

//config
var resmodifier = 0.4; //resolution modifier
var frametime = 3;
var cameradistance = 100;

window.addEventListener('load', function() {
  init();
});

let width, height, container;
let camera, renderer, loader, fontloader, scene;
let pScene, pCamera, pTexture, materialScreen;
let map = {};
let vector = new THREE.Vector3();
//setup
function init() {
  width = window.innerWidth;
  height = window.innerHeight;
  window.addEventListener('resize', function() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    //pCamera.aspect = width / height;
    //pCamera.updateProjectionMatrix();
    //pTexture.setSize(width / resmodifier, height / resmodifier);
  });

  //camera, container, renderer, loader, scene
  camera = new THREE.PerspectiveCamera(75, width / height, 10, 1000);
  camera.position.set(cameradistance, 70, cameradistance);

  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  loader = new GLTFLoader();

  fontloader = new THREE.FontLoader();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x154169);

  //pixellization
  pScene = new THREE.Scene();
  pCamera = new THREE.PerspectiveCamera(75, width / height, 10, 1000);
  pCamera.position.z = 1;
  pTexture = new THREE.WebGLRenderTarget(
    width / resmodifier,
    height / resmodifier,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBFormat
    }
  );
  materialScreen = new THREE.ShaderMaterial( {
    uniforms: { tDiffuse: { value: pTexture.texture } },
    vertexShader: `varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }`,
    fragmentShader: `varying vec2 vUv;
      uniform sampler2D tDiffuse;

      void main() {

        gl_FragColor = texture2D( tDiffuse, vUv );

      }`,
    depthWrite: false
  } );
  const plane = new THREE.PlaneGeometry(width, height);
  const quad = new THREE.Mesh( plane, materialScreen );
  quad.position.z = - 100;
  pScene.add( quad );

  //lighting

  //the problem with ambient light is that the texture of gltf model is metallic by default, which doesn't reflect ambient light - use pointlight or directional instead
  //const ambientLight = new THREE.AmbientLight(0xffffff, 1);

  //(red, green, blue)
  const axesHelper = new THREE.AxesHelper(5);
  //scene.add(axesHelper);

  const keylight = new THREE.DirectionalLight(0xff00000, 0.5);
  keylight.position.set(1, 1, 0);
  scene.add(keylight);

  const filight = new THREE.DirectionalLight(0xfff000, 0.3);
  filight.position.set(-1, -1, 0);
  scene.add(filight);


  //
  function get2DPos(obj) {
    let vector = obj.position;
    let canvas = renderer.domElement;
    vector.project(camera);
    vector.x = Math.round(( vector.x + 1) * canvas.width  / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);
    vector.z = 0;

    return vector
  }

  //player controls
  document.onkeydown = document.onkeyup = function(e) {
    e = e || event; // to deal with IE
    map[e.keyCode] = e.type == 'keydown';
  }

  createTestroom();

  animate();
}

//warning: real performance hazard
function replaceTexto(str) {
  texto.name = str;
  fontloader.load('fonts/king.json', function(font) {
    let geometry = new THREE.TextGeometry(str, {
      font: font,
      size: 2,
      height: 0.5
    });
    let material = new THREE.MeshToonMaterial({color: 0xffffff});
    let t = new THREE.Mesh(geometry, material);
    t.position.set(-10,-1.5,-5);
    t.receiveShadow = true;
    t.castShadow = true;
    texto.add(t);
  });
  texto.remove(texto.children[0]);
}

class NPC {

}

class StaticObject {

}

function createPlayer() {
  player.position.set(0,-0.5,0);
  player.speed = 0.15;
}

//animation
var frame = 0;
function animate() {

  for (var i in map) {
    if (map[i]) {
      key(i)
    }
  }

  let x = player.position.x;
  let z = player.position.z;

  camera.lookAt(player.position);

  if (frame == 0) {

  }
  frame++;
  if (frame >= frametime) {
    frame = 0
  }

  requestAnimationFrame(animate);

  renderer.setRenderTarget(pTexture);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(pScene, pCamera);

  // renderer.clear();
  // renderer.render(scene, camera);
}

var physics = {};
function key(k) {
  const speed = player.speed;

  if (k==87) { //w
    player.position.x -= speed;
    player.position.z -= speed;
  }
  if (k==83) { //s
    player.position.x += speed;
    player.position.z += speed;
  }
  if (k==65) { //a
    player.position.x -= speed;
    player.position.z += speed;
  }
  if (k==68) { //d
    player.position.x += speed;
    player.position.z -= speed;
  }
}

let testroom, ground, glowingbox, texto, player;
function createTestroom() {
  testroom = new THREE.Group();
  ground = new THREE.Group();
  glowingbox = new THREE.Group();
  texto = new THREE.Group();
  player = new THREE.Group();

  ground = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 30), new THREE.MeshToonMaterial({color: 0x964B00}));
  ground.position.set(0, -2, 0);
  ground.castShadow = false;
  ground.receiveShadow = true;
  testroom.add(ground);

  glowingbox.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshToonMaterial({color: 0xffffff})));
  let light = new THREE.PointLight(0xffffff, 1, 20);
  light.castShadow = true;
  glowingbox.add(light);
  glowingbox.position.set(0, 3, 8);
  testroom.add(glowingbox);

  //scene.add(new THREE.CameraHelper(light.shadow.camera))

  loader.load('models/person.gltf', function(gltf) {
    let material = new THREE.MeshToonMaterial({color: 0xffffff});
    gltf.scene.children[3].material = material;
    gltf.scene.children[2].material = material;
    gltf.scene.children[3].castShadow = true;
    gltf.scene.children[2].castShadow = true;
    player.add(gltf.scene);
  });
  testroom.add(player);
  createPlayer();

  texto.name = 'hello';
  fontloader.load('fonts/king.json', function(font) {
    let geometry = new THREE.TextGeometry('hello', {
      font: font,
      size: 2,
      height: 0.5
    });
    let material = new THREE.MeshToonMaterial({color: 0xffffff});
    let t = new THREE.Mesh(geometry, material);
    t.receiveShadow = true;
    t.castShadow = true;
    t.position.set(-10,-1.5,-5);
    texto.add(t);
  });
  scene.add(texto);

  scene.add(testroom);
}
